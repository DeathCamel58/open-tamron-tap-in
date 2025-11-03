export type AdapterInfo = {
  connected: boolean;
  connectedVersion?: number | null;
  firmwareVersion?: number | null;
  hardwareVersion?: number | null;
  lensAttached?: boolean | null;
  mountType?: string | null;
}
