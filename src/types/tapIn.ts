import calcCRC16 from "../util/crc16.ts";
import {bytesEqual} from "../util/byteCompare.ts";
import {ByteCommand, CommandByte} from "../util/CommandBytes.ts";
import {type ParsedPayload, parsePayloadByCommand} from "../util/commandParser.ts";

const destination: { 0: string; 1: string } = {
  0x00: 'Lens',
  0x01: 'Console'
}

class Header {
  public raw: Uint8Array;
  packageIndex: number;
  destination: string;

  constructor(raw: Uint8Array) {
    this.raw = raw;

    this.packageIndex = raw[0];

    if ( raw[1] === 0x00 || raw[1] === 0x01 ) {
      this.destination = destination[raw[1]];
    } else {
      this.destination = 'Unknown';
      console.error('Header\'s destination not valid!', raw[1])
    }
  }
}

class Payload {
  public raw: Uint8Array;
  public command: string;

  constructor(raw: Uint8Array) {
    this.raw = raw;

    if (CommandByte.IS_LENS_ATTACHED >= raw[0] && raw[0] >= CommandByte.ERROR && raw[0] !== 0xFE) {
      // @ts-expect-error We're already filtering out raw[0] to ensure it's valid
      this.command = ByteCommand[raw[0]];
    } else {
      this.command = 'Unknown';
    }
  }
}

class Frame {
  public raw: Uint8Array;

  // Computed
  public preamble: number;
  public header: Header;
  public payload: Payload;
  public crc: {
    raw: Uint8Array;
    expected: Uint8Array;
    valid: boolean;
  };
  public postamble: number;
  public parsedPayload: ParsedPayload;

  constructor(raw: Uint8Array, sent: boolean) {
    this.raw = raw;
    this.preamble = raw[0];

    this.header = new Header(raw.slice(1, 6)); // Header is 5 bytes after preamble

    this.payload = new Payload(raw.slice(6, raw.length - 3));

    const dataToCrc = raw.slice(0, raw.length - 3);
    const expectedCrc = calcCRC16(dataToCrc);
    const crcInFrame = raw.slice(raw.length - 3, raw.length - 1);
    this.crc = {
      raw: crcInFrame,
      expected: expectedCrc,
      valid: bytesEqual(crcInFrame, expectedCrc),
    }

    this.postamble = raw[raw.length];

    this.parsedPayload = parsePayloadByCommand(raw, sent);
  }
}

export class TapInMessage {
  public id: string;
  public ts: number;
  public raw: Uint8Array;
  public from: 'host' | 'console';
  public description: string | null;
  public parsed: string | null = null;

  // Computed values
  public frame: Frame;

  constructor(
    id: string,
    ts: number,
    raw: Uint8Array,
    from: 'host' | 'console',
    description: string | null = null,
    parsed: string | null = null,
  ) {
    this.ts = ts;
    this.id = id;
    this.raw = raw;
    this.from = from;
    this.description = description;
    this.parsed = parsed;

    this.frame = new Frame(raw, from === 'host');
  }
}
