import type {ParsedPayload} from "../commandParser.ts";
import {CommandByte, opcodeFromPayload} from "../CommandBytes.ts";
import {getLensInfo} from "../../state/deviceState.ts";
import type {LensSettings} from "../../types/LensSettings.ts";
import {parseSettingsPayload} from "../parseSettingsPayload.ts";

export function getSettingsParser(frame: Uint8Array, _sent: boolean): ParsedPayload {
  const payload = frame.slice(6, frame.length - 3)
  const parsed: ParsedPayload = {}

  const lensInfo = getLensInfo();

  parsed.cmd = opcodeFromPayload(payload) ?? CommandByte.GET_SETTINGS

  // TODO: Set human readable string
  // parsed.human = "Some human readable thing for the frame"

  if (payload.length === 1) {
    parsed.human = "Request for lens settings";
    return parsed;
  }

  // TODO: Check if payload size changes based on the lens?

  const lensSettings: LensSettings = parseSettingsPayload(payload, lensInfo);

  parsed.details = lensSettings;

  return parsed;
}
