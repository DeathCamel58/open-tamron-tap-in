import type {ParsedPayload} from "../commandParser.ts";
import {CommandByte, opcodeFromPayload} from "../CommandBytes.ts";
import {getLensInfo} from "../../state/deviceState.ts";
import type {LensSettings} from "../../types/LensSettings.ts";
import {parseSettingsPayload} from "../parseSettingsPayload.ts";

export function setSettingsParser(frame: Uint8Array, sent: boolean): ParsedPayload {
  const payload = frame.slice(6, frame.length - 3)
  const parsed: ParsedPayload = {}

  const lensInfo = getLensInfo();

  parsed.cmd = opcodeFromPayload(payload) ?? CommandByte.SET_SETTINGS

  // TODO: Set human readable string
  // parsed.human = "Some human readable thing for the frame"

  if (payload.length === 2) {
    if (payload[1] === 0x00) {
      parsed.human = "Lens Settings Updated";
    } else {
      console.error(`Bad status for SET_SETTINGS: ${payload[1]}`);
    }
  } else {
    const lensSettings: LensSettings = parseSettingsPayload(payload, lensInfo);

    parsed.details = lensSettings;
  }

  return parsed;
}
