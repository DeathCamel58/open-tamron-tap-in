import type {ParsedPayload} from "../commandParser.ts";
import {CommandByte, opcodeFromPayload} from "../CommandBytes.ts";

export function powerOnParser(frame: Uint8Array, sent: boolean): ParsedPayload {
  const payload = frame.slice(6, frame.length - 3)
  const parsed: ParsedPayload = {}
  parsed.cmd = opcodeFromPayload(payload) ?? CommandByte.IS_LENS_ATTACHED

  if (sent) {
    parsed.human = 'Request lens power on';
    parsed.details = { power_on: false };
  } else {
    if (payload.length === 2) {
      if (payload[1] === 0x00) {
        parsed.human = 'Power on Failed';
        parsed.details = { power_on: false };
      } else if (payload[1] === 0x01) {
        parsed.human = 'Lens powered on';
        parsed.details = { power_on: true };
      }
    } else {
      console.error(`Invalid payload length: ${payload.length}`);
    }
  }

  return parsed;
}
