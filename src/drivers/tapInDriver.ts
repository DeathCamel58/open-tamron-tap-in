import { SerialService } from '../services/serialService';
import {TapInMessage} from '../types/tapIn';
import calcCRC16 from "../util/crc16.ts";
import {bytesEqual} from "../util/byteCompare.ts";

export type TapInMessageHandler = (msg: TapInMessage) => void;

export const PREAMBLE = 0x0f;
export const POSTAMBLE = 0xf0;

// default addresses — adjust if necessary
export const DEST_LENS = 0x00;
export const DEST_CONSOLE = 0x01;
export const SRC_CONSOLE = 0x01; // source id for console (example)
export const RESERVED_BYTE = 0x00;
export const DEFAULT_FLAGS = 0x00;

export const CMD_IS_LENS_ATTACHED = new Uint8Array([0xf7]);
export const CMD_POWER_ON = new Uint8Array([0xf8, 0x00]);
export const CMD_POWER_OFF = new Uint8Array([0xf9]);
export const CMD_GET_STATUS = new Uint8Array([0xfa]);
export const CMD_SET_SETTING = new Uint8Array([0xfb]);
export const CMD_GET_SETTINGS = new Uint8Array([0xfc]);
export const CMD_UPDATE_FIRMWARE = new Uint8Array([0xfd]);
export const CMD_ERROR = 0xff;

export class TapInDriver {
  private serial: SerialService;
  private buffer = new Uint8Array(0);
  private pending: TapInMessage[] = []; // <--- pending queue
  private _onMessage: TapInMessageHandler | null = null; // internal handler storage
  private readonly id: string | null = null;

  constructor(serial: SerialService) {
    this.serial = serial;
    this.serial.onRawMessage = (chunk) => this.pushChunk(chunk);
    this.id = crypto.randomUUID();
    console.warn("New TapInDriver created with id: ", this.id);
  }

  /** Public API: use this to set/clear the message handler.
   *  When a handler is set, pending messages will be flushed synchronously.
   */
  public setMessageHandler(handler: TapInMessageHandler | null) {
    console.log("setMessageHandler for id: ", this.id);
    this._onMessage = handler;
    if (handler && this.pending.length > 0) {
      // flush queued messages in order
      for (const m of this.pending) {
        try {
          handler(m);
        } catch (err) {
          console.error('Error in message handler while flushing pending messages', err);
        }
      }
      this.pending = [];
    }
  }

  private nextPackageIndex = 1;

  public async sendPackage(destination: number, message: Uint8Array) {
    const len = message.length;
    const header = new Uint8Array(6);
    header[0] = PREAMBLE;
    header[1] = this.nextPackageIndex & 0xff;
    header[2] = destination & 0xff;
    header[3] = (destination >> 8) & 0xff;
    header[4] = len & 0xff;
    header[5] = (len >> 8) & 0xff;

    // Create a buffer for header + payload to calculate CRC
    const dataToCrc = new Uint8Array(header.length + len);
    dataToCrc.set(header, 0);
    dataToCrc.set(message, header.length);

    // Create the final frame
    const frame = new Uint8Array(header.length + len + 2 + 1); // header + payload + CRC(2) + postamble
    frame.set(dataToCrc, 0);

    // Calculate CRC on header + payload
    const crc = calcCRC16(dataToCrc);

    // Add CRC
    frame[header.length + len] = crc[0];
    frame[header.length + len + 1] = crc[1];
    frame[header.length + len + 2] = POSTAMBLE;

    this.nextPackageIndex++;
    if (this.nextPackageIndex > 0xff) this.nextPackageIndex = 1;

    await this.serial.writeBytes(frame);

    this.emitHostSent(frame);
  }

  // High-level commands (hardcoded init-like actions)
  public async powerOn(): Promise<void> {
    await this.sendPackage(DEST_CONSOLE, CMD_POWER_ON);
  }

  public async powerOff(): Promise<void> {
    await this.sendPackage(DEST_CONSOLE, CMD_POWER_OFF);
  }

  public async getStatus(): Promise<void> {
    await this.sendPackage(DEST_CONSOLE, CMD_GET_STATUS);
  }

  public async getStatusLens(): Promise<void> {
    await this.sendPackage(DEST_LENS, CMD_GET_STATUS);
  }

  public async checkLensAttached(): Promise<void> {
    await this.sendPackage(DEST_CONSOLE, CMD_IS_LENS_ATTACHED);
  }

  public async getSettings(): Promise<void> {
    await this.sendPackage(DEST_LENS, CMD_GET_SETTINGS);
  }

  // Send raw bytes (useful for tests)
  public async sendBytes(bytes: Uint8Array) {
    await this.serial.writeBytes(bytes);
    this.emitHostSent(bytes);
    console.log('TapInDriver.sendBytes: wrote', bytes);
  }

  /* ------------------ inbound parsing ------------------ */

  private pushChunk(chunk: Uint8Array) {
    // append chunk to internal buffer
    const combined = new Uint8Array(this.buffer.length + chunk.length);
    combined.set(this.buffer, 0);
    combined.set(chunk, this.buffer.length);
    this.buffer = combined;
    this.processBuffer();
  }

  private processBuffer() {
    while (true) {
      // Ensure there's a preamble
      const preIdx = this.buffer.indexOf(PREAMBLE);
      if (preIdx === -1) {
        // nothing to parse
        this.buffer = new Uint8Array(0);
        return;
      }
      // drop bytes before preamble
      if (preIdx > 0) this.buffer = this.buffer.slice(preIdx);

      // Ensure it ends with a postamble
      if (this.buffer[this.buffer.length - 1] !== POSTAMBLE) {
        return;
      }

      // Layout: [0]=0x0F, [1]=idx, [2]=dstLo, [3]=dstHi, [4]=lenLo, [5]=lenHi, [6..] payload, then 2-byte CRC, then 0xF0
      const lenLo = this.buffer[4];
      const lenHi = this.buffer[5];
      const pkgLen = (lenHi << 8) | lenLo;
      const expectedPkgLen = 6 + pkgLen + 2 + 1; // header(6 incl pre) + payload + CRC(2) + post(1)
      if (this.buffer.length >= expectedPkgLen) {
        const pkgFrame = this.buffer.slice(0, expectedPkgLen);
        // verify CRC over header+payload (same as sender does)
        const dataToCrc = pkgFrame.slice(0, 6 + pkgLen);
        const crcCalc = calcCRC16(dataToCrc);
        const crcFrame = pkgFrame.slice(pkgFrame.length - 3, pkgFrame.length - 1);

        if (bytesEqual(crcCalc, crcFrame)) {
          const msg = new TapInMessage(
            crypto.randomUUID(),
            Date.now(),
            pkgFrame,
            'console'
          );
          // console.log("processBuffer: invokeOrQueueMessage", msg);
          this.invokeOrQueueMessage(msg);
          // consume
          this.buffer = this.buffer.slice(expectedPkgLen);
        } else {
          console.warn("processBuffer: CRC mismatch — will attempt resync", this.buffer);
        }
      } else {
        console.error(`processBuffer: expected package length ${expectedPkgLen}; actual ${this.buffer.length}`, this.buffer);
        this.buffer = this.buffer.slice(expectedPkgLen);
      }
    }
  }

  /** If a handler exists call it; otherwise queue the message for later flushing */
  private invokeOrQueueMessage(msg: TapInMessage) {
    // console.log("invokeOrQueueMessage: Called for id: ", this.id);
    if (this._onMessage) {
      try {
        // call synchronously (you may also queueMicrotask if you want async)
        this._onMessage(msg);
      } catch (err) {
        console.error('Error in message handler', err);
      }
    } else {
      // queue until a handler is registered
      this.pending.push(msg);
      console.debug('Message queued until handler set', msg.id);
    }
  }

  private emitHostSent(bytes: Uint8Array) {
    const msg = new TapInMessage(
      crypto.randomUUID(),
      Date.now(),
      bytes,
      'host'
    );
    // console.log("emitHostSent: invokeOrQueueMessage", msg);
    this.invokeOrQueueMessage(msg);
  }
}
