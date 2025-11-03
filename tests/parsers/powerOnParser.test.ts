import { expect, test, describe } from 'vitest'
import {ParsedPayload} from "../../src/util/commandParser";
import {powerOnParser} from "../../src/util/parsers/powerOnParser";

describe('POWER_ON Parsing', () => {
  test('Request Power On', () => {
    const data = new Uint8Array([0x0f, 0x04, 0x01, 0x00, 0x02, 0x00, 0xf8, 0x00, 0xa4, 0x2a, 0xf0]);
    const parsed = powerOnParser(data, true);

    const expected: ParsedPayload = {
      "cmd": 248,
      "details": {
        "power_on": false,
      },
      "human": "Request lens power on",
    }

    expect(parsed).toEqual(expected);
  })
  test('Success', () => {
    const data = new Uint8Array([0x0f, 0x03, 0x01, 0x00, 0x02, 0x00, 0xf8, 0x01, 0xc1, 0x23, 0xf0]);
    const parsed = powerOnParser(data, false);

    const expected: ParsedPayload = {
      "cmd": 248,
      "details": {
        "power_on": true,
      },
      "human": "Lens powered on",
    }

    expect(parsed).toEqual(expected);
  })

  test('Failure', () => {
    const data = new Uint8Array([0x0f, 0x07, 0x01, 0x00, 0x02, 0x00, 0xf8, 0x00, 0x26, 0xf2, 0xf0]);
    const parsed = powerOnParser(data, false);

    const expected: ParsedPayload = {
      "cmd": 248,
      "details": {
        "power_on": false,
      },
      "human": "Power on Failed",
    }

    expect(parsed).toEqual(expected);
  })
})
