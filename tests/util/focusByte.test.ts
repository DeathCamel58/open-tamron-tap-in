import {describe, expect, it} from "vitest";
import {focusByteToNumber, focusNumberToByte} from "../../src/util/focusByte";

describe("Focus Bytes", () => {
  describe("Byte to Number", () => {
    it("-20", () => {
      const byte = 0xEC;
      const expected = -20;
      expect(focusByteToNumber(byte)).toEqual(expected);
    });

    it("-10", () => {
      const byte = 0xF6;
      const expected = -10;
      expect(focusByteToNumber(byte)).toEqual(expected);
    });

    it("0", () => {
      const byte = 0x00;
      const expected = 0;
      expect(focusByteToNumber(byte)).toEqual(expected);
    });

    it("10", () => {
      const byte = 0x0A;
      const expected = 10;
      expect(focusByteToNumber(byte)).toEqual(expected);
    });

    it("20", () => {
      const byte = 0x14;
      const expected = 20;
      expect(focusByteToNumber(byte)).toEqual(expected);
    });
  });

  describe("Number to Byte", () => {
    it("-20", () => {
      const number = -20;
      const expected = 0xEC;
      expect(focusNumberToByte(number)).toEqual(expected);
    });

    it("-20", () => {
      const number = -10;
      const expected = 0xF6;
      expect(focusNumberToByte(number)).toEqual(expected);
    });

    it("0", () => {
      const number = 0;
      const expected = 0x00;
      expect(focusNumberToByte(number)).toEqual(expected);
    });
    it("10", () => {
      const number = 10;
      const expected = 0x0A;
      expect(focusNumberToByte(number)).toEqual(expected);
    });
    it("20", () => {
      const number = 20;
      const expected = 0x14;
      expect(focusNumberToByte(number)).toEqual(expected);
    });
  });
});
