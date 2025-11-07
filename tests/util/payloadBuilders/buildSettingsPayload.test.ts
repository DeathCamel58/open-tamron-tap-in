import { expect, test, describe } from 'vitest'
import {LensSettings} from "../../../src/types/LensSettings";
import {buildSettingsPayload} from "../../../src/util/payloadBuilders/buildSettingsPayload";

describe('GET_SETTINGS Parsing', () => {
  describe('F013', () => {
    test('Default Settings', () => {

      const lensSettings: LensSettings = {
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
      }

      const payload = buildSettingsPayload(lensSettings);



      const expected = new Uint8Array([
        0xfb, 0x02, 0x02, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00
      ]);

      expect(payload).toEqual(expected);
    })
  })
})
