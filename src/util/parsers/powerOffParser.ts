import type {ParsedPayload} from "../commandParser.ts";
import {CommandByte, opcodeFromPayload} from "../CommandBytes.ts";

export function powerOffParser(frame: Uint8Array, sent: boolean): ParsedPayload {
  const payload = frame.slice(6, frame.length - 3)
  const parsed: ParsedPayload = {}
  parsed.cmd = opcodeFromPayload(payload) ?? CommandByte.POWER_ON

  if (sent) {
    parsed.human = 'Request lens power off';
  } else {
    if (payload.length === 2) {
      if (payload[1] === 0x00) {
        parsed.human = 'Power off failed';
        parsed.details = { power_off: false };
      } else if (payload[1] === 0x01) {
        parsed.human = 'Lens powered off';
        parsed.details = { power_off: true };
      }
    } else {
      console.error(`Invalid payload length: ${payload.length}`);
    }
  }

  return parsed;
}
