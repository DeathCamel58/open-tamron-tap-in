import {CommandByte, opcodeFromPayload} from "./CommandBytes.ts";
import {lensAttachedParser} from "./parsers/lensAttachedParser.ts";
import {powerOnParser} from "./parsers/powerOnParser.ts";
import {powerOffParser} from "./parsers/powerOffParser.ts";
import {getSettingsParser} from "./parsers/getSettingsParser.ts";
import {getStatusParser} from "./parsers/getStatusParser.ts";
import {byteArrayToString} from "./byteArrayPrinting.ts";
import {errorParser} from "./parsers/errorParser.ts";
import {setSettingsParser} from "./parsers/setSettingsParser.ts";

export type ParsedPayload = {
  cmd?: number;
  human?: string;           // short single-line description
  details?: any;            // structured data about the payload
};

export type CommandParser = (payload: Uint8Array, sent: boolean) => ParsedPayload;

// registry mapping opcode -> parser
export const commandParsers: Record<number, CommandParser> = {};

// Register our parsers
// TODO: Build other parsers
commandParsers[CommandByte.ERROR] = errorParser;
commandParsers[CommandByte.IS_LENS_ATTACHED] = lensAttachedParser;
commandParsers[CommandByte.POWER_ON] = powerOnParser;
commandParsers[CommandByte.POWER_OFF] = powerOffParser;
commandParsers[CommandByte.GET_STATUS] = getStatusParser;
commandParsers[CommandByte.GET_SETTINGS] = getSettingsParser;
commandParsers[CommandByte.SET_SETTINGS] = setSettingsParser;
// commandParsers[CommandByte.UPDATE_FIRMWARE] = updateFirmwareParser;

// fallback parser for unknown opcodes:
export const fallbackParser: CommandParser = (payload, _sent: boolean) => ({
  cmd: opcodeFromPayload(payload) ?? undefined,
  human: 'Payload parsing failed!',
  details: { raw: payload },
});

export function parsePayloadByCommand(frame: Uint8Array, sent: boolean): ParsedPayload {
  console.log(`Parsing frame: ${byteArrayToString(frame, ', ', '0x' )}`)

  const opcode = opcodeFromPayload(frame.slice(6, frame.length - 3));
  const parser = opcode !== null && commandParsers[opcode] ? commandParsers[opcode] : fallbackParser;
  try {
    return parser(frame, sent);
  } catch (err) {
    console.error('Error parsing payload for opcode', opcode, err);
    return { cmd: opcode ?? undefined, human: 'parse-error', details: { error: String(err), raw: frame } };
  }
}
