import type {LensSettings} from "../types/LensSettings.ts";
import type {LensInfo} from "../types/LensInfo.ts";

export function parseSettingsPayload(payload: Uint8Array, lensInfo: LensInfo) {
  const lensSettings: LensSettings = {};

  // this.setControlStatusPintoAdjust();

  // this.setControlStatusFulltime();
  lensSettings.fullTimeManualFocusOverride = {
    enabled: lensInfo.focus?.adjFtm,
    value: payload[1] - 1,
  };

  // this.setControlStatusLimitSwitch();

  lensSettings.vcModes = [{}, {}, {}];
  switch (lensInfo.adjVcType) {
    default:
    case false:
      lensSettings.vcModes[0].enabled = lensInfo.focus.adjVc;
      lensSettings.vcModes[1].enabled = lensInfo.focus.adjVc;
      lensSettings.vcModes[2].enabled = lensInfo.focus.adjVc;
      break;
    case true:
      lensSettings.vcModes[0].enabled = lensInfo.focus.adjVc;
      lensSettings.vcModes[1].enabled = lensInfo.focus.adjVc;
      lensSettings.vcModes[2].enabled = false;
      break;
  }

  if (!lensSettings.vcModes[0].enabled) {
    lensSettings.vcMode = 0;
  } else {
    if (payload[2] >= 0 && payload[2] <= 3) {
      lensSettings.vcMode = payload[2];
    } else {
      console.error(`Bad VC mode ${payload[2]}, defaulting to 0x01`);
    }
  }

  let focusDataOffset = 12;
  lensSettings.focusValues = []
  for (let i = 0; i < 3; i++) {
    const focusData = payload.slice(focusDataOffset, focusDataOffset + 8);
    focusDataOffset += 8;

    lensSettings.focusValues.push([
      focusData[0],
      focusData[1],
      focusData[2],
      focusData[3],
      focusData[4],
      focusData[5],
      focusData[6],
      focusData[7],
    ]);
  }

  return lensSettings;
}
