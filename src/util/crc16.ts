export default function calcCRC16(data: Uint8Array): Uint8Array {
  // let crc = 0xf1ef; // Initial value
  let crc = 0x0000; // Initial value
  const poly = 0x1021; // Polynomial

  for (const b of data) {
    // XOR the byte into the high 8 bits of the CRC
    crc ^= (b << 8);

    // Process all 8 bits
    for (let i = 0; i < 8; i++) {
      // Check if the MSB is set
      if ((crc & 0x8000) !== 0) {
        // If set, shift left, mask, and XOR with polynomial
        crc = ((crc << 1) & 0xffff) ^ poly;
      } else {
        // If not set, just shift left and mask
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  // Return the final 16-bit CRC as a 2-byte Uint8Array (little-endian)
  const result = new Uint8Array(2);
  result[0] = crc & 0xff;        // Low byte
  result[1] = (crc >> 8) & 0xff; // High byte
  return result;
}
