import { describe, expect, it } from "vitest";
import path from "path";
import fs from "fs";
import {DecryptionFirmware} from "../../src/types/DecryptionFirmware";

describe("decryptionFirmware", () => {
  it("Decrypt: F013N0 firmware", () => {
    const lensModelMount = "F013N0";
    const firmwareVersion = "0301";
    const paths = {
      xml: path.join(process.cwd(), 'public', 'tapin', 'lens', `lensinfo_${lensModelMount}.xml`),
      firmware: path.join(process.cwd(), 'public', 'tapin', 'lens', `${lensModelMount}_${firmwareVersion}.tfwf`),
      decrypted: path.join(process.cwd(), 'tests', 'types', `${lensModelMount}_${firmwareVersion}.dec`),
    }

    for (const [key, value] of Object.entries(paths)) {
      if (!fs.existsSync(value)) {
        expect.fail(`${key} file not found at path: ${value}`);
      }
    }

    const firmwareData = fs.readFileSync(paths.firmware, null);

    const xmlContent = fs.readFileSync(paths.xml, 'utf-8');
    const match = xmlContent.match(/<lensinfo[^>]*>([\s\S]*?)<\/lensinfo>/i);

    if (!match || !match[1]) {
      throw new Error("Could not find or parse <lensinfo> tag in the XML file.");
    }

    const xmlValues = match[1].split(',');

    const decryptionKey = xmlValues[xmlValues.length - 1];

    const decryptor = new DecryptionFirmware();

    const result = decryptor.createDecryptionFile(
      firmwareData,
      decryptionKey
    );

    const decrypted = fs.readFileSync(paths.decrypted);

    expect(decrypted.equals(result)).toBe(true); // Your actual test logic would go here
  });
});
