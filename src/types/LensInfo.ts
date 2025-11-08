export type LensInfo = {
  lensAttachedConversionLensID?: number;
  type?: string;
  model?: string;
  serial?: string;
  version?: {
    main0?: Uint8Array;
    main1?: Uint8Array;
    sub0?: Uint8Array;
    sub1?: Uint8Array;
    hw?: Uint8Array;
    conn?: Uint8Array;
  };
  focus?: {
    adjFocus?: boolean;
    adjFtm?: boolean;
    adjFlimitSw?: boolean;
    adjVc?: boolean;
  }
  adjVcType?: number | null;
  focusFocalLengths?: number;
  focusPerFocalLength?: number;
  flimitSwNum?: number;
  flimitSwType?: number;
  flimitSwMode?: Array<number>;
  flimitSwPartition?: number;
  adjFocusMax?: number;
  adjFocusMin?: number;
  flimitSwInit?: Array<number>;
  adjFocusIndex?: Array<number>;

  xmlData?: any;
};
