/** Convert unsigned byte (0–255) to signed number (-128–127) */
export function focusByteToNumber(byte: number): number {
  if (byte < 0 || byte > 0xFF) throw new RangeError("Byte must be between 0 and 255");
  return byte >= 0x80 ? byte - 0x100 : byte;
}

/** Convert signed number (-128–127) to unsigned byte (0–255) */
export function focusNumberToByte(value: number): number {
  if (value < -128 || value > 127) throw new RangeError("Value must be between -128 and 127");
  return (value + 0x100) & 0xFF;
}
