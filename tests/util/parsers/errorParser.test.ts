import { expect, test, describe } from 'vitest'
import {ParsedPayload} from "../../../src/util/commandParser";
import {errorParser} from "../../../src/util/parsers/errorParser";

describe('ERROR Parsing', () => {
  test('Power On', () => {
    // TODO: Fix an issue with this. I don't think this is the correct data frame
    const data = new Uint8Array([0x0f, 0x03, 0x01, 0x00, 0x02, 0x00, 0xff, 0x10, 0x46, 0xb8, 0xf0]);
    const parsed = errorParser(data, false);

    const expected: ParsedPayload = {
      "cmd": 255,
      "details": {},
      "human": "General Error",
    }

    expect(parsed).toEqual(expected);
  })
})
