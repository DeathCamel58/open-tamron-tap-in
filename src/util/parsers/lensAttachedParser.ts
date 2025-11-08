import type {ParsedPayload} from "../commandParser.ts";
import {CommandByte, opcodeFromPayload} from "../CommandBytes.ts";

export function lensAttachedParser(frame: Uint8Array, _sent: boolean): ParsedPayload {
  const payload = frame.slice(6, frame.length - 3)
  const parsed: ParsedPayload = {}
  parsed.cmd = opcodeFromPayload(payload) ?? CommandByte.IS_LENS_ATTACHED
  if (payload.length === 1) {
    parsed.human = 'Request for lens attached status';
  } else if (payload.length === 2) {
    if (payload[1] === 0x00) {
      parsed.human = 'No lens attached';
      parsed.details = { attached: false };
    } else if (payload[1] === 0x01) {
      parsed.human = 'Lens attached';
      parsed.details = { attached: true };
    }
  } else {
    console.error(`Invalid payload length: ${payload.length}`);
  }

  return parsed;
}
