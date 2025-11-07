type PossiblyDisabled<T> = {
  enabled?: boolean;
  value?: T;
  name?: string;
}

export type LensSettings = {
  // Stores the focus adjustment values
  // [0] -> Short focus adjustment
  // [1] -> Medium focus adjustment
  // [2] -> Long focus adjustment
  focusValues?: Array<Array<number>>;

  // Stores the focal lengths that the focus values adjust
  // 8 items correlate to the 8 values in focusValues[x]
  focusValuesMm?: Array<number>;

  // Values:
  // -1 = Off
  //  0 = Low
  //  1 = Normal
  //  2 = High
  fullTimeManualFocusOverride?: PossiblyDisabled<number>;

  // index 0 == vcmode1
  // index 1 == vcmode2
  // index 2 == vcmode3
  vcModes?: Array<PossiblyDisabled<null>>;

  // Values:
  // 1 = Viewfinder Priority
  // 2 = Standard Priority
  // 3 = Capturing Priority
  vcMode?: number;
};
