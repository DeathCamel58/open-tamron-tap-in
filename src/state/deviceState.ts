import type { LensInfo } from '../types/LensInfo';
import type { AdapterInfo } from '../types/AdapterInfo';
import type { LensSettings } from '../types/LensSettings';

// Simple in-memory device state store accessible from any module (.ts/.tsx)
// Not reactive by itself; exposes minimal pub/sub for consumers that need notifications.

let currentLensInfo: LensInfo = {};
let currentAdapterInfo: AdapterInfo = { connected: false };
let currentLensSettings: LensSettings = {};

// Subscribers
const lensInfoSubscribers = new Set<(state: LensInfo) => void>();
const adapterInfoSubscribers = new Set<(state: AdapterInfo) => void>();
const lensSettingsSubscribers = new Set<(state: LensSettings) => void>();

// Utilities
function mergeLensInfo(prev: LensInfo, patch: Partial<LensInfo> | LensInfo): LensInfo {
  const next = patch as Partial<LensInfo>;
  return {
    ...prev,
    ...next,
    // Merge nested objects immutably when provided
    version: next.version ? { ...(prev.version ?? {}), ...next.version } : prev.version,
    focus: next.focus ? { ...(prev.focus ?? {}), ...next.focus } : prev.focus,
  };
}

function emitLensInfo() {
  for (const cb of lensInfoSubscribers) cb(currentLensInfo);
}
function emitAdapterInfo() {
  for (const cb of adapterInfoSubscribers) cb(currentAdapterInfo);
}
function emitLensSettings() {
  for (const cb of lensSettingsSubscribers) cb(currentLensSettings);
}

// LensInfo API
export function getLensInfo(): Readonly<LensInfo> {
  return currentLensInfo;
}
export function setLensInfo(
  update: Partial<LensInfo> | LensInfo | ((prev: LensInfo) => Partial<LensInfo> | LensInfo)
): Readonly<LensInfo> {
  const patch = typeof update === 'function' ? update(currentLensInfo) : update;
  currentLensInfo = mergeLensInfo(currentLensInfo, patch);
  emitLensInfo();
  return currentLensInfo;
}
export function subscribeLensInfo(cb: (state: LensInfo) => void): () => void {
  lensInfoSubscribers.add(cb);
  return () => lensInfoSubscribers.delete(cb);
}
export function resetLensInfo() {
  currentLensInfo = {};
  emitLensInfo();
}

// AdapterInfo API
export function getAdapterInfo(): Readonly<AdapterInfo> {
  return currentAdapterInfo;
}
export function setAdapterInfo(
  update: Partial<AdapterInfo> | AdapterInfo | ((prev: AdapterInfo) => Partial<AdapterInfo> | AdapterInfo)
): Readonly<AdapterInfo> {
  const patch = typeof update === 'function' ? update(currentAdapterInfo) : update;
  currentAdapterInfo = { ...currentAdapterInfo, ...patch };
  emitAdapterInfo();
  return currentAdapterInfo;
}
export function subscribeAdapterInfo(cb: (state: AdapterInfo) => void): () => void {
  adapterInfoSubscribers.add(cb);
  return () => adapterInfoSubscribers.delete(cb);
}
export function resetAdapterInfo() {
  currentAdapterInfo = { connected: false };
  emitAdapterInfo();
}

// LensSettings API
export function getLensSettings(): Readonly<LensSettings> {
  return currentLensSettings;
}
export function setLensSettings(
  update: Partial<LensSettings> | LensSettings | ((prev: LensSettings) => Partial<LensSettings> | LensSettings)
): Readonly<LensSettings> {
  const patch = typeof update === 'function' ? update(currentLensSettings) : update;
  currentLensSettings = { ...currentLensSettings, ...patch };
  emitLensSettings();
  return currentLensSettings;
}
export function subscribeLensSettings(cb: (state: LensSettings) => void): () => void {
  lensSettingsSubscribers.add(cb);
  return () => lensSettingsSubscribers.delete(cb);
}
export function resetLensSettings() {
  currentLensSettings = {};
  emitLensSettings();
}
