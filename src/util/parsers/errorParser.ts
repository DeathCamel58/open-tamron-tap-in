import type {ParsedPayload} from "../commandParser.ts";
import {CommandByte, opcodeFromPayload} from "../CommandBytes.ts";

export function errorParser(frame: Uint8Array, sent: boolean): ParsedPayload {
  const payload = frame.slice(6, frame.length - 3)
  const parsed: ParsedPayload = {}
  parsed.cmd = opcodeFromPayload(payload) ?? CommandByte.ERROR

  if (sent) {
    console.error("We shouldn't ever send an error to the adapter")
  } else {
    if (payload.length === 2) {
      switch (payload[1]) {
        case 0x10:
          // Observed when:
          //     Powering on lens already on
          //     Getting status of lens when not on
          //     Getting settings of lens when not on
          parsed.human = 'Error Powering On Lens';
          parsed.details = {}; // TODO: Document this error
          break;
        default:
          parsed.human = 'Unknown Error';
          parsed.details = { error: "UNKNOWN_ERROR" };
          console.error("Unknown Error", frame);
          break;
      }
    } else {
      console.error(`Invalid payload length: ${payload.length}`);
    }
  }

  return parsed;
}
