import { expect, test, describe } from 'vitest'
import {ParsedPayload} from "../../../src/util/commandParser";
import {powerOffParser} from "../../../src/util/parsers/powerOffParser";

describe('POWER_OFF Parsing', () => {
  test('Request Power Off', () => {
    const data = new Uint8Array([0x0f, 0x04, 0x01, 0x00, 0x01, 0x00, 0xf9, 0x1f, 0x6f, 0xf0]);
    const parsed = powerOffParser(data, true);

    const expected: ParsedPayload = {
      "cmd": 249,
      "human": "Request lens power off",
    }

    expect(parsed).toEqual(expected);
  })
  test('Success', () => {
    const data = new Uint8Array([0x0f, 0x04, 0x01, 0x00, 0x01, 0x00, 0xf9, 0x01, 0xb4, 0x09, 0xf0]);
    const parsed = powerOffParser(data, false);

    const expected: ParsedPayload = {
      "cmd": 249,
      "details": {
        "power_off": true,
      },
      "human": "Lens powered off",
    }

    expect(parsed).toEqual(expected);
  })

  // Haven't seen a failure yet, once I do, check the parsing for it
})
