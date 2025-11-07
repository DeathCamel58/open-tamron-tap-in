import { expect, test, describe } from 'vitest'
import {getStatusParser} from "../../../src/util/parsers/getStatusParser";
import {ParsedPayload} from "../../../src/util/commandParser";
import {AdapterInfo} from "../../../src/types/AdapterInfo";
import {setAdapterInfo} from "../../../src/state/deviceState";

describe('GET_STATUS Parsing', () => {
  describe('TAP-in Console Status', () => {
    test('TAP-in Console Status - 1', () => {
      const data = new Uint8Array([
        0x0f, 0x01, 0x01, 0x00, 0x56, 0x00, 0xfa, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x01,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0xf3, 0x58, 0xf0
      ]);
      const parsed = getStatusParser(data, false);

      const expected: ParsedPayload = {
        "cmd": 250,
        "details": {
          "type": "TAP-in Console",
          "connection_version": 1,
          "firmware_version": 3,
          "hardware_version": 1,
          "mounted": "N0",
        },
        "human": "TAP-in Console Status: ",
      }

      expect(parsed).toEqual(expected);
    })
  })

  describe('TAP-in Lens Status', () => {
    test('TAP-in Lens Status - 1', () => {
      // Some globals required, as the information changes based on them
      const adapterInfo: AdapterInfo = {
        connected: true,
        firmwareVersion: 3,
        mountType: "N0",
        hardwareVersion: 1,
        connectedVersion: 1,
      }

      setAdapterInfo(adapterInfo);

      const data = new Uint8Array([
        0x0f, 0x06, 0x00, 0x00, 0x56, 0x00, 0xfa, 0x00,
        0x00, 0x00, 0x46, 0x30, 0x31, 0x33, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x30, 0x30, 0x30, 0x30, 0x31, 0x39,
        0x30, 0x33, 0x30, 0x30, 0x30, 0x30, 0x37, 0x33,
        0x31, 0x35, 0x03, 0x01, 0x02, 0x00, 0x01, 0x00,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x0b, 0x00, 0x01, 0x03, 0x00, 0x35,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x14, 0xec,
        0x00, 0x00, 0x00, 0x00, 0x2d, 0x00, 0x2d, 0x00,
        0x2d, 0x00, 0x2d, 0x00, 0x2d, 0x00, 0x2d, 0x00,
        0x2d, 0x00, 0x2d, 0x00, 0x60, 0xe0, 0xf0
      ]);
      const parsed = getStatusParser(data, false);

      const expected: ParsedPayload = {
        "cmd": 250,
        "details": expect.objectContaining({
          "adjFocusIndex": [45, 45, 45, 45, 45, 45, 45, 45],
          "adjFocusMax": 20,
          "adjFocusMin": -20,
          "adjVcType": 0,
          "flimitSwInit": [52, 52, 52, 52],
          "flimitSwMode": [1, 1, 1, 1],
          "flimitSwNum": 0,
          "flimitSwPartition": 53,
          "flimitSwType": 0,
          "focus": {
            "adjFlimitSw": false,
            "adjFocus": true,
            "adjFtm": true,
            "adjVc": true,
          },
          "focusFocalLengths": 1,
          "focusPerFocalLength": 3,
          "type": "Lens",
          // "focusNum": Uint8Array[1, 3],
          "model": "F013",
          "serial": "000019030000731",
          xmlData: {
            adjFocusIndex: ["45", "45", "45", "45", "45", "45", "45", "45"],
            adjFocusMax: "30",
            adjFocusMin: "-30",
            decryptKey: "035E5241374047595E28645E5C22725243540D554876205341494132595E5D1A",
            flimitSwInit: ["1", "1", "1", "1"],
            flimitSwNum: "0",
            flimitSwPartition: "1",
            focus: {
              adjFlimitSw: false,
              adjFocus: true,
              adjFtm: true,
              adjVc: true,
            },
            focusFocalLengths: "1",
            focusPerFocalLength: "3",
            model: "A013",
            type: "SP 45mm F/1.8 Di VC USD",
          },
        }),
        "human": "Lens Status: ",
      }

      expect(parsed.details.version.conn).toEqual(new Uint8Array([0x01, 0x00]));
      expect(parsed.details.version.hw).toEqual(new Uint8Array([0x00, 0x00]));
      expect(parsed.details.version.main0).toEqual(new Uint8Array([0x03, 0x01]));
      expect(parsed.details.version.main1).toEqual(new Uint8Array([0x02, 0x00]));
      expect(parsed.details.version.sub0).toEqual(new Uint8Array([0x01, 0x00]));
      expect(parsed.details.version.sub1).toEqual(new Uint8Array([0x01, 0x00]));
      expect(parsed).toEqual(expect.objectContaining(expected));
    })
  })
})
