const CRCTable = new Uint32Array([
  0, 4129, 8258, 12387, 16516, 20645, 24774, 28903, 33032, 37161,
  41290, 45419, 49548, 53677, 57806, 61935, 4657, 528, 12915, 8786,
  21173, 17044, 29431, 25302, 37689, 33560, 45947, 41818, 54205, 50076,
  62463, 58334, 9314, 13379, 1056, 5121, 25830, 29895, 17572, 21637,
  42346, 46411, 34088, 38153, 58862, 62927, 50604, 54669, 13907, 9842,
  5649, 1584, 30423, 26358, 22165, 18100, 46939, 42874, 38681, 34616,
  63455, 59390, 55197, 51132, 18628, 22757, 26758, 30887, 2112, 6241,
  10242, 14371, 51660, 55789, 59790, 63919, 35144, 39273, 43274, 47403,
  23285, 19156, 31415, 27286, 6769, 2640, 14899, 10770, 56317, 52188,
  64447, 60318, 39801, 35672, 47931, 43802, 27814, 31879, 19684, 23749,
  11298, 15363, 3168, 7233, 60846, 64911, 52716, 56781, 44330, 48395,
  36200, 40265, 32407, 28342, 24277, 20212, 15891, 11826, 7761, 3696,
  65439, 61374, 57309, 53244, 48923, 44858, 40793, 36728, 37256, 33193,
  45514, 41451, 53516, 49453, 61774, 57711, 4224, 161, 12482, 8419,
  20484, 16421, 28742, 24679, 33721, 37784, 41979, 46042, 49981, 54044,
  58239, 62302, 689, 4752, 8947, 13010, 16949, 21012, 25207, 29270,
  46570, 42443, 38312, 34185, 62830, 58703, 54572, 50445, 13538, 9411,
  5280, 1153, 29798, 25671, 21540, 17413, 42971, 47098, 34713, 38840,
  59231, 63358, 50973, 55100, 9939, 14066, 1681, 5808, 26199, 30326,
  17941, 22068, 55628, 51565, 63758, 59695, 39368, 35305, 47498, 43435,
  22596, 18533, 30726, 26663, 6336, 2273, 14466, 10403, 52093, 56156,
  60223, 64286, 35833, 39896, 43963, 48026, 19061, 23124, 27191, 31254,
  2801, 6864, 10931, 14994, 64814, 60687, 56684, 52557, 48554, 44427,
  40424, 36297, 31782, 27655, 23652, 19525, 15522, 11395, 7392, 3265,
  61215, 65342, 53085, 57212, 44955, 49082, 36825, 40952, 28183, 32310,
  20053, 24180, 11923, 16050, 3793, 7920
]);

interface DecryptProgressEvent {
  progressPercentage: number;
}

type DecryptProgressCallback = (event: DecryptProgressEvent) => void;

export class DecryptionFirmware {
  private static readonly HEADER_DATA_LENGTH = 1024;
  private static readonly HEADER_OFFSET_DATASIZE = 64;
  private static readonly HEADER_OFFSET_DATACRC = 70;
  private static readonly CRC_VAL_LENGTH = 2;
  private static readonly BINARY_DATA_LENGTH_MAX = 1048576; // 0x100000

  private decryptionKeyInfo: { key: Uint8Array } = { key: new Uint8Array(32) };
  private baseKeyInfo: { key: Uint8Array };
  private keyIndex: number = 0;

  public onDecryptProgress?: DecryptProgressCallback;

  constructor() {
    const basePassPhrase = "EncryptionToolBaseKey";
    this.baseKeyInfo = { key: this.createKey(basePassPhrase) };
  }

  public createDecryptionFile(inputData: Uint8Array, decKeyData: string): Uint8Array | number {
    // Validate and create decryption key
    if (!decKeyData || this.createDecryptionKey(decKeyData) !== 0) {
      return -1;
    }

    this.initAlgorithm(this.decryptionKeyInfo.key);

    // Use provided input data (no disk I/O)
    const inputBuffer: Uint8Array = inputData;

    // Prepare in-memory output buffer chunks (no Node Buffer usage)
    const outputChunks: Uint8Array[] = [];
    let position = 0;

    while (position < inputBuffer.length) {
      // Read header
      if (position + DecryptionFirmware.HEADER_DATA_LENGTH > inputBuffer.length) {
        if (position === inputBuffer.length) {
          break; // End of file reached cleanly
        }
        return -3; // ERROR_INVALID_FILE
      }

      const headerData = inputBuffer.slice(position, position + DecryptionFirmware.HEADER_DATA_LENGTH);
      const decryptedHeader = this.doAlgorithm(headerData);

      // Report progress
      this.reportProgress(position, inputBuffer.length);

      // Extract data size from header (little-endian 32-bit integer)
      const dataSize =
        (decryptedHeader[DecryptionFirmware.HEADER_OFFSET_DATASIZE] |
          (decryptedHeader[DecryptionFirmware.HEADER_OFFSET_DATASIZE + 1] << 8) |
          (decryptedHeader[DecryptionFirmware.HEADER_OFFSET_DATASIZE + 2] << 16) |
          (decryptedHeader[DecryptionFirmware.HEADER_OFFSET_DATASIZE + 3] << 24)) >>> 0;

      if (dataSize > DecryptionFirmware.BINARY_DATA_LENGTH_MAX) {
        return -3; // ERROR_INVALID_FILE
      }

      // Extract CRC from header
      const headerCrc = decryptedHeader.slice(
        DecryptionFirmware.HEADER_OFFSET_DATACRC,
        DecryptionFirmware.HEADER_OFFSET_DATACRC + DecryptionFirmware.CRC_VAL_LENGTH
      );

      position += DecryptionFirmware.HEADER_DATA_LENGTH;

      // Read data block
      if (position + dataSize > inputBuffer.length) {
        return -3; // ERROR_INVALID_FILE
      }

      const encryptedData = inputBuffer.slice(position, position + dataSize);
      const decryptedData = this.doAlgorithm(encryptedData);

      // Report progress
      this.reportProgress(position + dataSize, inputBuffer.length);

      // Verify CRC
      const calculatedCrc = this.calculateCrc(decryptedData);
      if (!this.arraysEqual(calculatedCrc, headerCrc)) {
        return -4; // ERROR_CRC
      }

      // Append to output chunks
      try {
        outputChunks.push(decryptedHeader);
        outputChunks.push(decryptedData);
      } catch (error) {
        return -5; // ERROR_WRITE
      }

      position += dataSize;
    }

    // Return concatenated decrypted bytes (header+data blocks)
    try {
      let totalLength = 0;
      for (const chunk of outputChunks) totalLength += chunk.length;
      const output = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of outputChunks) {
        output.set(chunk, offset);
        offset += chunk.length;
      }
      return output;
    } catch (error) {
      return -5; // ERROR_WRITE
    }
  }

  private createDecryptionKey(decryptionKeyData: string): number {
    // Validate: must be 64 hex characters
    if (decryptionKeyData.length !== 64 || !/^[0-9A-F]+$/i.test(decryptionKeyData)) {
      return -1;
    }

    // Convert hex string to bytes
    const keyBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      const hexByte = decryptionKeyData.substring(i * 2, i * 2 + 2);
      keyBytes[i] = parseInt(hexByte, 16);
    }

    // Decrypt the key using base key
    this.initAlgorithm(this.baseKeyInfo.key);
    this.decryptionKeyInfo.key = this.doAlgorithm(keyBytes);

    return 0;
  }

  private createKey(passPhrase: string): Uint8Array {
    const keyLength = 32;
    const destinationArray = new Uint8Array(keyLength);

    const num = Math.floor(keyLength / passPhrase.length);
    const length = keyLength % passPhrase.length;

    const passPhraseBytes = new TextEncoder().encode(passPhrase);

    for (let index = 0; index < num; index++) {
      destinationArray.set(passPhraseBytes, index * passPhrase.length);
    }

    if (length !== 0) {
      destinationArray.set(
        passPhraseBytes.slice(0, length),
        num * passPhrase.length
      );
    }

    return destinationArray;
  }

  private doAlgorithm(inData: Uint8Array): Uint8Array {
    const outData = new Uint8Array(inData.length);
    for (let i = 0; i < inData.length; i++) {
      outData[i] = inData[i] ^ this.decryptionKeyInfo.key[this.keyIndex];
      this.keyIndex = (this.keyIndex + 1) % this.decryptionKeyInfo.key.length;
    }
    return outData;
  }

  private initAlgorithm(key: Uint8Array): void {
    this.keyIndex = 0;
    this.decryptionKeyInfo.key = new Uint8Array(key);
  }

  private calculateCrc(data: Uint8Array): Uint8Array {
    let dataIndex = 0;
    let dataLength = data.length;
    let crc = 0; // This will be treated as an unsigned 32-bit integer.

    while (--dataLength >= 0) {
      // 1. Get the current byte
      const byte = data[dataIndex++];

      // 2. Determine the index for the CRC table
      //    (crc >>> 8) is an unsigned 32-bit right shift (same as C#'s uint >>)
      const tableIndex = ((crc >>> 8) ^ byte) & 0xFF; // & 0xFF is same as & 255

      // 3. Calculate the new CRC
      //    (crc << 8) is a 32-bit left shift
      //    We use ( ... ) >>> 0 to ensure the final result is an unsigned 32-bit integer,
      //    as bitwise operations in JS are otherwise treated as signed.
      crc = (CRCTable[tableIndex] ^ (crc << 8)) >>> 0;
    }

    // Return the final 16-bit CRC as two bytes
    return new Uint8Array([
      crc & 0xFF,         // Low byte
      (crc >>> 8) & 0xFF  // High byte
    ]);
  }

  private arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  private reportProgress(current: number, total: number): void {
    if (this.onDecryptProgress) {
      const percentage = Math.floor((current * 100) / total);
      this.onDecryptProgress({ progressPercentage: percentage });
    }
  }
}
