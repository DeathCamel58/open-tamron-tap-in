import {describe, expect, it} from "vitest";
import {bytesEqual} from "../../src/util/byteCompare";

describe("bytesEqual", () => {
  it("should return true for two identical Uint8Array instances", () => {
    const bytes1 = new Uint8Array([1, 2, 3]);
    const bytes2 = new Uint8Array([1, 2, 3]);
    expect(bytesEqual(bytes1, bytes2)).toBe(true);
  });

  it("should return false for Uint8Array instances of different lengths", () => {
    const bytes1 = new Uint8Array([1, 2, 3]);
    const bytes2 = new Uint8Array([1, 2, 3, 4]);
    expect(bytesEqual(bytes1, bytes2)).toBe(false);
  });

  it("should return false for Uint8Array instances with different values", () => {
    const bytes1 = new Uint8Array([1, 2, 3]);
    const bytes2 = new Uint8Array([4, 5, 6]);
    expect(bytesEqual(bytes1, bytes2)).toBe(false);
  });

  it("should return true for two empty Uint8Array instances", () => {
    const bytes1 = new Uint8Array([]);
    const bytes2 = new Uint8Array([]);
    expect(bytesEqual(bytes1, bytes2)).toBe(true);
  });

  it("should return false for Uint8Array instances with same lengths but one differing value", () => {
    const bytes1 = new Uint8Array([1, 2, 3]);
    const bytes2 = new Uint8Array([1, 2, 4]);
    expect(bytesEqual(bytes1, bytes2)).toBe(false);
  });
});
