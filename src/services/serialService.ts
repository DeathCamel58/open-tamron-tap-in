export type OnRaw = (chunk: Uint8Array) => void;
export type OnStatus = (connected: boolean) => void;

export interface SerialOptions {
  baudRate?: number;
}

export class SerialService {
  // @ts-expect-error Serial API doesn't have types
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private keepReading = false;
  private options: SerialOptions = {}

  public onRawMessage: OnRaw | null = null;
  public onStatus: OnStatus | null = null;

  constructor(baudRate: number = 11520) {
    this.options.baudRate = baudRate;
  }

  public async requestAndOpenPort(): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API not supported in this browser.');
    }

    // @ts-expect-error navigator.serial does exist by now, as we used a guard before
    this.port = await navigator.serial.requestPort({filters: [{usbVendorId: 0x2cd1}]});
    await this.openPort();
  }

  // @ts-expect-error Serial API doesn't have types
  public async openPort(port?: SerialPort): Promise<void> {
    if (port) this.port = port;
    if (!this.port) throw new Error('No serial port provided.');

    const baudRate = this.options.baudRate ?? 115200;
    await this.port.open({ baudRate });

    this.onStatus?.(true);

    if (!this.port.writable) throw new Error('Port has no writable stream.');
    this.writer = this.port.writable.getWriter();

    if (!this.port.readable) throw new Error('Port has no readable stream.');
    this.reader = this.port.readable.getReader();
    this.keepReading = true;
    this.readLoop().catch((err) => {
      console.warn('readLoop error', err);
      // attempt to close
      this.close().catch(() => {});
    });
  }

  private async readLoop(): Promise<void> {
    if (!this.reader) return;
    try {
      while (this.keepReading) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value && value.length > 0) {
          // forward raw bytes (value is a Uint8Array)
          this.onRawMessage?.(value);
        }
      }
    } catch (err) {
      console.error('Serial read error', err);
      throw err;
    } finally {
      this.onStatus?.(false);
    }
  }

  public async writeBytes(bytes: Uint8Array): Promise<void> {
    if (!this.writer) throw new Error('Serial port not open for writing.');
    await this.writer.write(bytes);
  }

  public async write(data: string): Promise<void> {
    const enc = new TextEncoder();
    await this.writeBytes(enc.encode(data));
  }

  public async writeLine(line: string): Promise<void> {
    await this.write(line + '\n');
  }

  public async close(): Promise<void> {
    this.keepReading = false;

    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
      }
    } catch (e) {
      console.warn('Error cancelling reader', e);
    } finally {
      this.reader = null;
    }

    try {
      if (this.writer) {
        await this.writer.close();
        this.writer.releaseLock();
      }
    } catch (e) {
      console.warn('Error closing writer', e);
    } finally {
      this.writer = null;
    }

    try {
      if (this.port && this.port.close) {
        await this.port.close();
      }
    } catch (e) {
      console.warn('Error closing port', e);
    } finally {
      this.onStatus?.(false);
      this.port = null;
    }
  }

  public isOpen(): boolean {
    return !!(this.port && this.port.readable && this.port.writable);
  }
}
