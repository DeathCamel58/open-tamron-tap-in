import { expect, test, describe } from 'vitest'
import {ParsedPayload} from "../../src/util/commandParser";
import {errorParser} from "../../src/util/parsers/errorParser";

describe('ERROR Parsing', () => {
  test('Power On', () => {
    const data = new Uint8Array([0x0f, 0x03, 0x01, 0x00, 0x02, 0x00, 0xff, 0x10, 0x46, 0xb8, 0xf0]);
    const parsed = errorParser(data, false);

    const expected: ParsedPayload = {
      "cmd": 248,
      "details": {
        "power_on": false,
      },
      "human": "Request lens power on",
    }

    expect(parsed).toEqual(expected);
  })
})
