import { expect, test, describe } from 'vitest'
import {ParsedPayload} from "../../../src/util/commandParser";
import {getSettingsParser} from "../../../src/util/parsers/getSettingsParser";
import {LensInfo} from "../../../src/types/LensInfo";
import {setAdapterInfo, setLensInfo} from "../../../src/state/deviceState";

describe('GET_SETTINGS Parsing', () => {
  describe('F013', () => {
    test('Default Settings', () => {
      // Some globals required, as the settings change based on them
      const lensInfo: LensInfo = {
        // lensAttachedConversionLensID: details.lensAttachedConversionLensID ?? prev.lensAttachedConversionLensID,
        type: "Lens",
        model: "F013",
        serial: "000019030000731",
        version: {
          main0: new Uint8Array([0x03, 0x01]),
          main1: new Uint8Array([0x02, 0x00]),
          sub0: new Uint8Array([0x01, 0x00]),
          sub1: new Uint8Array([0x01, 0x00]),
          hw: new Uint8Array([0x00, 0x00]),
          conn: new Uint8Array([0x01, 0x00]),
        },
        focus: {
          adjFlimitSw: false,
          adjFocus: true,
          adjFtm: true,
          adjVc: true,
        },
        adjVcType: false,
        focusFocalLengths: 1,
        focusPerFocalLength: 3,
        flimitSwNum: 0,
        flimitSwType: 0,
        flimitSwMode: [1, 1, 1, 1],
        flimitSwPartition: 53,
        adjFocusMax: 20,
        adjFocusMin: 4294967276,
        flimitSwInit: [52, 52, 52, 52],
        adjFocusIndex: [45, 45, 45, 45, 45, 45, 45, 45],
      }

      setLensInfo(lensInfo);

      const data = new Uint8Array([
        0x0f, 0x07, 0x00, 0x00, 0x24, 0x00, 0xfc, 0x02,
        0x02, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x8e, 0xad, 0xf0
      ]);
      const parsed = getSettingsParser(data, false);

      const expected: ParsedPayload = {
        cmd: 252,
        details: {
          focusValues: [
            [ 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0 ],
          ],
          fullTimeManualFocusOverride: {
            enabled: true,
            value: 1,
          },
          vcMode: 2,
          vcModes: [
            {
              enabled: true,
            },
            {
              enabled: true,
            },
            {
              enabled: true,
            },
          ],
        },
      }

      expect(parsed).toEqual(expected);
    })
  })
})
