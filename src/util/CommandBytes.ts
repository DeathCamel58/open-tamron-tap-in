export const ByteCommand = {
  0xF7: 'IS_LENS_ATTACHED',
  0xF8: 'POWER_ON',
  0xF9: 'POWER_OFF',
  0xFA: 'GET_STATUS',
  0xFB: 'SET_SETTING',
  0xFC: 'GET_SETTINGS',
  0xFD: 'UPDATE_FIRMWARE',
  0xFF: 'ERROR',
}

export const CommandByte = {
  IS_LENS_ATTACHED: 0xF7,
  POWER_ON: 0xF8,
  POWER_OFF: 0xF9,
  GET_STATUS: 0xFA,
  SET_SETTINGS: 0xFB,
  GET_SETTINGS: 0xFC,
  UPDATE_FIRMWARE: 0xFD,
  ERROR: 0xFF,
}

export function opcodeFromPayload(payload: Uint8Array): number | null {
  if (!payload || payload.length === 0) return null;
  return payload[0];
}
