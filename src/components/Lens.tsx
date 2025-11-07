import React, {useEffect, useMemo, useState} from 'react';
import { useSerial } from '../contexts/SerialContext';
import JsonView from "@uiw/react-json-view";
import {FocusAdjustments} from "./FocusAdjustments.tsx";
import {byteArrayToString} from "../util/byteArrayPrinting.ts";
import { DecryptionFirmware } from "../types/DecryptionFirmware.ts";

const VcModeOptions = [
  { value: 1, label: "Viewfinder Priority", description: "Stabilization of the viewfinder image is prioritized" },
  { value: 2, label: "Standard", description: "" },
  { value: 3, label: "Capturing Priority", description: "Stabilization of the captured photo is prioritized" },
];

export const Lens: React.FC = () => {
  const { adapter, lensInfo, lensSettings, updateSettings } = useSerial();

  const [editableLensSettings, setEditableLensSettings] = useState(lensSettings);

  // Decryption UI state
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptProgress, setDecryptProgress] = useState<number | null>(null);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  useEffect(() => {
    setEditableLensSettings(lensSettings);
  }, [lensSettings]);

  const handleFocusValuesChange = (newFocusValues: number[][]) => {
    setEditableLensSettings(prevSettings => ({
      ...prevSettings,
      focusValues: newFocusValues,
    }));
  };

  const handleVcModeChange = (newVcMode: number) => {
    setEditableLensSettings(prevSettings => ({
      ...prevSettings,
      vcMode: newVcMode,
    }));
  };
  const currentVcMode = editableLensSettings?.vcMode ?? 0;

  const hasPendingChanges = useMemo(() => {
    const originalJson = JSON.stringify(lensSettings);
    const editableJson = JSON.stringify(editableLensSettings);

    return originalJson !== editableJson;
  }, [lensSettings, editableLensSettings]);

  const handleApplySettings = async () => {
    console.log("Applying pending changes to the lens:", editableLensSettings);

    await updateSettings(editableLensSettings);
  };

  // Cleanup any created object URL when component unmounts or before creating a new one
  useEffect(() => {
    return () => {
      if (decryptedUrl) URL.revokeObjectURL(decryptedUrl);
    };
  }, [decryptedUrl]);

  const attachedLabel =
    adapter.lensAttached === null ? 'Not Attached' : adapter.lensAttached ? 'Attached' : 'Not Attached';

  const lensModel = lensInfo.xmlData?.type ? lensInfo.xmlData?.type : lensInfo.model;

  const encryptedUrl = useMemo(() => {
    if (!lensInfo?.version?.main0 || !lensInfo?.model || !adapter?.mountType) return null;
    return `/tapin/lens/${lensInfo.model}${adapter.mountType}_${byteArrayToString(lensInfo.version.main0)}.tfwf`;
  }, [lensInfo?.version?.main0, lensInfo?.model, adapter?.mountType]);

  const decryptedFileName = useMemo(() => {
    if (!lensInfo?.version?.main0 || !lensInfo?.model || !adapter?.mountType) return 'decrypted.bin';
    return `${lensInfo.model}${adapter.mountType}_${byteArrayToString(lensInfo.version.main0)}_decrypted.bin`;
  }, [lensInfo?.version?.main0, lensInfo?.model, adapter?.mountType]);

  const handleDecrypt = async () => {
    if (!encryptedUrl) return;
    setDecryptError(null);
    setIsDecrypting(true);
    setDecryptProgress(0);
    // Revoke previous URL if any
    if (decryptedUrl) {
      URL.revokeObjectURL(decryptedUrl);
      setDecryptedUrl(null);
    }
    try {
      // Download encrypted firmware
      const resp = await fetch(encryptedUrl);
      if (!resp.ok) throw new Error(`Failed to download firmware: ${resp.status} ${resp.statusText}`);
      const buf = await resp.arrayBuffer();
      const inputData = new Uint8Array(buf);

      // Run decryption
      const decryptor = new DecryptionFirmware();
      decryptor.onDecryptProgress = (event) => {
        setDecryptProgress(event.progressPercentage);
      };

      const result = decryptor.createDecryptionFile(
        inputData,
        lensInfo.xmlData.decryptKey
      );

      if (typeof result === 'number') {
        let msg = 'Unknown error';
        switch (result) {
          case -1: msg = 'Invalid decryption key.'; break;
          case -3: msg = 'Invalid firmware file format.'; break;
          case -4: msg = 'CRC check failed for decrypted data.'; break;
          case -5: msg = 'Error while generating output.'; break;
        }
        throw new Error(msg);
      }

      // Create downloadable blob
      const blob = new Blob([result], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      setDecryptedUrl(url);
      setDecryptProgress(100);
    } catch (e: any) {
      setDecryptError(e?.message ?? String(e));
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-5">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Lens - {!adapter.lensAttached ? attachedLabel : lensModel}</h2>
      </div>
      <div className="flex-1 min-h-0">
        <div className="px-6 py-4 border-b bg-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              {adapter.lensAttached && (
                <img src={`/tapin/lens/tapinLensImage_${lensInfo.model}-${adapter.mountType}.png`} alt={`Image of ${lensInfo.model} with ${adapter.mountType} mount`} />
              )}

              <div className="text-sm text-slate-600 mt-1">
                Status: <span className={adapter.lensAttached ? 'text-emerald-600' : 'text-slate-800'}>{attachedLabel}</span>
              </div>
              {lensInfo.model && (
                <div className="text-sm text-slate-700 mt-1">Model: <span className="font-mono"><a className="text-blue-700" href={`https://www.tamron.com/global/consumer/lenses/${lensInfo.model.toLowerCase()}/`} target="_blank" rel="noopener">{lensInfo.model}</a></span></div>
              )}
              {lensInfo.serial && (
                <div className="text-sm text-slate-700">Serial: <span className="font-mono">{lensInfo.serial}</span></div>
              )}

              {lensInfo.version && (
                <div className="text-xs text-slate-500 mt-1 grid grid-cols-1 gap-x-4">
                  {lensInfo.version.main0 && (
                    <>
                      <div>Major Version: <span className="font-mono">{lensInfo.version.main0[0]}</span></div>
                      <div>Minor Version: <span className="font-mono">{lensInfo.version.main0[1]}</span></div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>Main FW 0: <span className="font-mono">{byteArrayToString(lensInfo.version.main0)}</span> - </span>
                        <a className="text-blue-700" href={`/tapin/lens/${lensInfo.model}${adapter.mountType}_${byteArrayToString(lensInfo.version.main0)}.tfwf`} target="_blank" rel="noopener">Encrypted</a>
                        {encryptedUrl && (
                          <>
                            {decryptedUrl && !isDecrypting ?
                              <a
                                className="text-emerald-700"
                                href={decryptedUrl}
                                download={decryptedFileName}
                              >
                                Download decrypted
                              </a>
                            :
                              <>
                                <button
                                  onClick={handleDecrypt}
                                  disabled={isDecrypting}
                                  className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                                  type="button"
                                >
                                  {isDecrypting ? 'Decrypting…' : 'Decrypt'}
                                </button>
                                {typeof decryptProgress === 'number' && isDecrypting && (
                                  <span className="text-xs text-slate-600">Progress: {decryptProgress}%</span>
                                )}
                              </>
                            }
                            {decryptError && (
                              <span className="text-xs text-red-600">Error: {decryptError}</span>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                  {typeof lensInfo.version.main1 !== 'undefined' && (
                    <div>Main FW 1: <span className="font-mono">{byteArrayToString(lensInfo.version.main1)}</span></div>
                  )}
                  {typeof lensInfo.version.sub0 !== 'undefined' && (
                    <div>Sub FW 0: <span className="font-mono">{byteArrayToString(lensInfo.version.sub0)}</span></div>
                  )}
                  {typeof lensInfo.version.sub1 !== 'undefined' && (
                    <div>Sub FW 1: <span className="font-mono">{byteArrayToString(lensInfo.version.sub1)}</span></div>
                  )}
                  {typeof lensInfo.version.hw !== 'undefined' && (
                    <div>HW: <span className="font-mono">{byteArrayToString(lensInfo.version.hw)}</span></div>
                  )}
                  {typeof lensInfo.version.conn !== 'undefined' && (
                    <div>Conn: <span className="font-mono">{byteArrayToString(lensInfo.version.conn, " ", "0x")}</span></div>
                  )}
                </div>
              )}

              <hr />

              <div>
                <p>lensInfo:</p>
                <JsonView value={lensInfo} className="mt-1" collapsed={2} />
              </div>

              <hr />

              {lensSettings && (
                <div>
                  <p>Lens Settings</p>

                  {adapter.lensAttached && (
                    <>
                      <FocusAdjustments lensInfo={lensInfo} lensSettings={editableLensSettings} adapterInfo={adapter} focusValues={editableLensSettings?.focusValues || []} onChange={handleFocusValuesChange} />

                      <hr />

                      <div>
                        <p>Focus Limiter</p>
                        <img src={`/tapin/lens/tapinFocusLimit_${lensInfo.model}-${adapter.mountType}.png`} alt={`${lensInfo.model}'s focus Limit Chart`} className="w-full" />
                        TODO: Determine how focus limits work (my lens doesn't have this option)
                      </div>

                      <hr />

                      <div>
                        <p>Miscellaneous</p>
                        {lensInfo.xmlData?.focus.adjFtm && (
                          <>
                            <div
                              className="grid gap-y-2"
                              style={{ gridTemplateColumns: `repeat(2, minmax(0, 1fr))` }}
                            >
                              {editableLensSettings.fullTimeManualFocusOverride?.enabled && (
                                <>
                                  <div className="bg-white p-3 flex items-center border-b">
                                    <div className="flex-1">Full-Time manual focus override</div>
                                  </div>
                                  <div className="bg-white p-3 flex items-center border-b">
                                    <div className="flex-1">
                                      <input
                                        type="checkbox"
                                        checked={editableLensSettings.fullTimeManualFocusOverride?.value !== -1 || false}
                                        onChange={(e) => {
                                          let valueToUse = -1;

                                          if (e.target.checked) {
                                            valueToUse = 1;
                                          }

                                          setEditableLensSettings(prevSettings => ({
                                            ...prevSettings,
                                            fullTimeManualFocusOverride: {
                                              ...(prevSettings.fullTimeManualFocusOverride || {}),
                                              value: valueToUse,
                                            },
                                          }));
                                        }}
                                      />
                                      Enable Manual Override
                                    </div>
                                  </div>

                                  {editableLensSettings.fullTimeManualFocusOverride?.value !== -1 && (
                                    <>
                                      <div className="bg-white p-3 flex items-center border-b">
                                        <div className="flex-1">Angular control sensitivity</div>
                                      </div>
                                      <div className="bg-white p-3 flex items-center border-b">
                                        <div className="flex-1">
                                          <input
                                            type="range"
                                            min={0}
                                            max={2}
                                            step={1}
                                            value={editableLensSettings.fullTimeManualFocusOverride?.value || 0}
                                            className="w-full h-2 rounded-lg accent-sky-600"
                                            aria-label="Angular Control Sensitivity slider"
                                            onChange={(e) => {
                                              setEditableLensSettings(prevSettings => ({
                                                ...prevSettings,
                                                fullTimeManualFocusOverride: {
                                                  ...(prevSettings.fullTimeManualFocusOverride || {}),
                                                  value: parseInt(e.target.value, 10), // Remember to parse the value
                                                },
                                              }));
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </>
                              )}

                              {lensInfo.focus?.adjVc && (
                                <>
                                  <div className="bg-white p-3 flex items-center border-b">
                                    <div className="flex-1">VC Mode</div>
                                  </div>
                                  <div className="bg-white p-3 flex items-center border-b">
                                    <div className="flex-1">
                                      {VcModeOptions.map((option) => (
                                        <label key={option.value} className="flex items-start p-3 bg-white rounded-lg border cursor-pointer hover:bg-blue-50 transition-colors duration-150">
                                          <input
                                            type="radio"
                                            name="vcMode"
                                            value={option.value}
                                            className="h-4 w-4 mt-1 text-sky-600 border-gray-300 focus:ring-sky-500"
                                            checked={currentVcMode === option.value}
                                            onChange={() => handleVcModeChange(option.value)}
                                          />
                                          <div className="ml-3">
                                            <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                                            <p className="text-xs text-gray-500">{option.description}</p>
                                          </div>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex justify-end p-4 border-t border-blue-200">
                    <button
                      type="button"
                      onClick={handleApplySettings}
                      disabled={!hasPendingChanges}
                      className="px-6 py-2 text-white font-semibold rounded-lg shadow-md transition-colors duration-200
                   disabled:bg-gray-400 disabled:cursor-not-allowed
                   bg-sky-600 hover:bg-sky-700 active:bg-sky-800"
                    >
                      Apply Pending Changes
                    </button>
                  </div>

                  <p>lensSettings:</p>
                  <JsonView value={lensSettings} className="mt-1" collapsed={2}/>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
