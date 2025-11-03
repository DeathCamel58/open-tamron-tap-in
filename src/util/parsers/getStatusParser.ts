import type {ParsedPayload} from "../commandParser.ts";
import {CommandByte, opcodeFromPayload} from "../CommandBytes.ts";
import type {LensInfo} from "../../contexts/SerialContext.tsx";
import {focusByteToNumber} from "../focusByte.ts";
import {getAdapterInfo} from "../../state/deviceState.ts";

export function getStatusParser(frame: Uint8Array, sent: boolean): ParsedPayload {
  let payload = frame.slice(6, frame.length - 3)

  const parsed: ParsedPayload = {}
  parsed.cmd = opcodeFromPayload(payload) ?? CommandByte.GET_STATUS

  payload = payload.slice(1, payload.length);

  parsed.details = {};
  switch (frame[2]) {
    case 0x00:
      parsed.details.type = "Lens";
      break;
    case 0x01:
      parsed.details.type = "TAP-in Console";
      break;
    default:
      console.error("Couldn't determine what the status request is for");
      parsed.details.type = "Unknown";
      break;
  }

  if (sent) {
    parsed.human = "Get Status";
  } else {
    if (payload.length != 85) {
      console.error(`Payload should be 85 bytes, length is ${payload.length}`);
      return parsed;
    }

    // Handle both lens and console status types
    switch (frame[2]) {
      case 0x00:
      {
        parsed.human = "Lens Status: ";

        const lensInfo: LensInfo = {};

        let currentIndex = 3;
        lensInfo.type = "Lens";
        // const lensAttachedConversionLensID = payload[0]
        let indexIncrement = 16;
        const model = payload.slice(currentIndex, currentIndex + indexIncrement);
        currentIndex += indexIncrement;

        const modelLength = model.indexOf(0x00);
        let modelBytes = model.slice(0, modelLength);
        if (modelLength == -1) {
          modelBytes = model.slice(0, model.length);
        }
        lensInfo.model = new TextDecoder().decode(modelBytes);

        indexIncrement = 16;
        const serial = payload.slice(currentIndex, currentIndex + indexIncrement);
        currentIndex += indexIncrement;

        const serialLength = serial.indexOf(0x00);
        if (serialLength == -1) {
          lensInfo.serial = "UNDEFINED";
        }
        lensInfo.serial = new TextDecoder().decode(serial.slice(0, serialLength));

        indexIncrement = 2;
        lensInfo.version = {};
        lensInfo.version.main0 = payload.slice(currentIndex, currentIndex + indexIncrement);
        currentIndex += indexIncrement;
        lensInfo.version.main1 = payload.slice(currentIndex, currentIndex + indexIncrement);
        currentIndex += indexIncrement;
        lensInfo.version.sub0 = payload.slice(currentIndex, currentIndex + indexIncrement);
        currentIndex += indexIncrement;
        lensInfo.version.sub1 = payload.slice(currentIndex, currentIndex + indexIncrement);
        currentIndex += indexIncrement + 4;
        lensInfo.version.hw = payload.slice(currentIndex, currentIndex + indexIncrement);
        currentIndex += indexIncrement;
        lensInfo.version.conn = payload.slice(currentIndex, currentIndex + indexIncrement);
        currentIndex += indexIncrement;

        // Data in Packed Bytes
        indexIncrement = 1;
        const lensAdjustmentOptions = payload[currentIndex];
        currentIndex += indexIncrement;
        lensInfo.focus = {};
        lensInfo.focus.adjFocus = !!(lensAdjustmentOptions & 1);
        lensInfo.focus.adjFtm = !!(lensAdjustmentOptions & 2);
        lensInfo.focus.adjFlimitSw = !!(lensAdjustmentOptions & 4);
        lensInfo.focus.adjVc = !!(lensAdjustmentOptions & 8);

        lensInfo.adjVcType = payload[currentIndex];
        currentIndex += indexIncrement;

        indexIncrement = 2;
        // Byte 0 is the number of mm focal lengths we can configure
        // Byte 1 is the number of focus adjustments we can't make for the focal lengths
        lensInfo.focusFocalLengths = payload[currentIndex];
        lensInfo.focusPerFocalLength = payload[currentIndex + 1];
        // lensInfo.focusNum = payload[currentIndex].slice(currentIndex, currentIndex + indexIncrement);
        currentIndex += indexIncrement;

        indexIncrement = 1;
        const lensFlimitSwOptions = payload[currentIndex];
        currentIndex += indexIncrement;
        lensInfo.flimitSwNum = lensFlimitSwOptions & 3;
        lensInfo.flimitSwType = (lensFlimitSwOptions >> 2) & 3;
        lensInfo.flimitSwMode = [];
        let num = (lensFlimitSwOptions & 240) >> 4;
        for (let i = 0; i < 4; ++i) {
          lensInfo.flimitSwMode[i] = (num & 1) === 1 ? 2 : 1;
          num >>= 1;
        }

        lensInfo.flimitSwPartition = payload[currentIndex];
        currentIndex += indexIncrement + 6;

        lensInfo.adjFocusMax = payload[currentIndex];
        currentIndex += indexIncrement;

        lensInfo.adjFocusMin = focusByteToNumber(payload[currentIndex]);
        currentIndex += indexIncrement;

        lensInfo.flimitSwInit = [];
        for (let i = 0; i < 4; ++i) {
          const offset = payload[currentIndex];
          lensInfo.flimitSwInit[i] = lensInfo.flimitSwPartition - 1 - offset;
          currentIndex += indexIncrement;
        }

        lensInfo.adjFocusIndex = [];
        for (let i = 0; i < 8; ++i) {
          const currentData = payload[currentIndex];
          const currentData_1 = payload[currentIndex + 1];
          lensInfo.adjFocusIndex[i] = (currentData_1 << 8) | currentData;
          currentIndex += 2;
        }

        try {
          const adapterInfo = getAdapterInfo();
          const isEnvNode = typeof window === 'undefined';

          let xmlContent = "";
          if (isEnvNode) {
            // Load XML only in Node (tests). Use dynamic require to avoid bundlers including Node modules in browser builds.
            const fs = (eval('require') as any)('fs') as typeof import('fs');
            const path = (eval('require') as any)('path') as typeof import('path');
            const xmlPath = path.join(process.cwd(), 'public', 'tapin', 'lens', `lensinfo_${lensInfo.model}${adapterInfo.mountType}.xml`);
            if (fs.existsSync(xmlPath)) {
              xmlContent = fs.readFileSync(xmlPath, 'utf-8');
            }
          } else {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `/tapin/lens/lensinfo_${lensInfo.model}${adapterInfo.mountType}.xml`, false);
            try {
              xhr.send();
              if (xhr.status === 200) {
                xmlContent = xhr.responseText;
              }
            } catch (error) {
              console.error('Error fetching lens XML:', error);
            }
          }

          if (xmlContent) {
            // The XML format is a single tag with CSV content, e.g. <lensinfo>v1,v2,...</lensinfo>
            const match = xmlContent.match(/<lensinfo[^>]*>([\s\S]*?)<\/lensinfo>/i);
            if (match) {
              const xmlValues = match[1].split(',');

              const adjFocusIndex = [];
              for (let i = 0; i < 8; i++) {
                adjFocusIndex[i] = xmlValues[10 + i];
              }

              const flimitSwInit = [];
              for (let i = 0; i < 4; i++) {
                flimitSwInit[i] = xmlValues[22 + i];
              }

              lensInfo.xmlData = {
                model: xmlValues[1],
                type: xmlValues[2],
                // lensMainFwVer0: [ // xmlValues[3]
                //   // Major Version (3)
                //   // Minor Version (1)
                // ],
                focus: {
                  adjFocus: xmlValues[4] === "true",
                  adjFlimitSw: xmlValues[5] === "true",
                  adjFtm: xmlValues[6] === "true",
                  adjVc: xmlValues[7] === "true",
                },
                focusFocalLengths: xmlValues[8],
                focusPerFocalLength: xmlValues[9],
                adjFocusIndex: adjFocusIndex,
                adjFocusMax: xmlValues[18],
                adjFocusMin: xmlValues[19],
                flimitSwNum: xmlValues[20],
                flimitSwPartition: xmlValues[21],
                flimitSwInit: flimitSwInit,
                decryptKey: xmlValues[26],
              };
            }
          }
        } catch (error) {
          console.error('Error parsing lens XML:', error);
        }

        parsed.details = lensInfo;

        break;
      }
      case 0x01:
      {
        parsed.human = "TAP-in Console Status: ";

        parsed.details.firmware_version = payload[35] | (payload[36] << 8);
        const mounted = payload[47];

        switch (mounted) {
          case 0x01:
            parsed.details.mounted = "E0"; // Canon
            break;
          case 0x02:
            parsed.details.mounted = "N0"; // Nikon
            break;
          case 0x03:
            parsed.details.mounted = "S0"; // Sony
            break;
          default:
            parsed.details.mounted = "UNKNOWN";
            console.error("Unknown Mounted Type ", mounted)
            break;
        }

        parsed.details.hardware_version = payload[48];
        parsed.details.connection_version = payload[49] | (payload[50] << 8);

        break;
      }
    }
  }

  return parsed;
}
