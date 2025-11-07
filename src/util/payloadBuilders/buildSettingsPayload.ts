import { CommandByte } from "../CommandBytes.ts";
import { getLensInfo } from "../../state/deviceState.ts";
import type { LensSettings } from "../../types/LensSettings.ts";

/**
 * Opposite of getSettingsParser: takes LensSettings and produces the Uint8Array payload.
 */
export function buildSettingsPayload(lensSettings: LensSettings): Uint8Array {
  const lensInfo = getLensInfo();

  /**
   * Byte 0 : opcode (SET_SETTING)
   * Byte 1 : full time manual focus override value + 1
   * Byte 2 : vcMode (0-3) or 0 if VC disabled
   * Bytes 3..11  : Unknown / unused (based on your parser)
   * Bytes 12..35 : Three 8-byte focus blocks
   */

  const payload = new Uint8Array(36); // matches the parsed structure (12 + 24 bytes)

  // -----------------------------------------------------
  // BYTE 0 — command opcode
  // -----------------------------------------------------
  payload[0] = CommandByte.SET_SETTINGS;

  // -----------------------------------------------------
  // BYTE 1 — fullTimeManualFocusOverride.value + 1
  // (parser: value = payload[1] - 1)
  // -----------------------------------------------------
  const ftm = lensSettings.fullTimeManualFocusOverride;
  payload[1] = (ftm?.value ?? 0) + 1;

  // -----------------------------------------------------
  // BYTE 2 — VC mode
  // -----------------------------------------------------
  let mode = lensSettings.vcMode ?? 0;
  if (mode < 0 || mode > 3) mode = 0;
  payload[2] = mode;

  // -----------------------------------------------------
  // BYTES 3–11 — Reserved / untouched / zeros
  // -----------------------------------------------------
  for (let i = 3; i < 12; i++) payload[i] = 0x00;

  payload[6] = 0x01;
  payload[10] = 0x01;

  // -----------------------------------------------------
  // BYTES 12..35 — focus blocks (3 blocks × 8 bytes)
  // parser copies them 1:1 into lensSettings.focusValues
  // -----------------------------------------------------
  const focus = lensSettings.focusValues ?? [];
  let offset = 12;

  for (let i = 0; i < 3; i++) {
    const block = focus[i] ?? [0, 0, 0, 0, 0, 0, 0, 0];

    if (block.length !== 8) {
      console.warn(`Focus block ${i} length != 8, padding with zeros`);
    }

    for (let b = 0; b < 8; b++) {
      payload[offset++] = block[b] ?? 0;
    }
  }

  return payload;
}
