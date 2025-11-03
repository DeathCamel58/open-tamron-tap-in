import React, {useEffect, useState} from 'react';
import { useSerial } from '../contexts/SerialContext';
import JsonView from "@uiw/react-json-view";
import {FocusAdjustments} from "./FocusAdjustments.tsx";
import {byteArrayToString} from "../util/byteArrayPrinting.ts";

export const Lens: React.FC = () => {
  const { adapter, lensInfo, lensSettings } = useSerial();

  const [focusValues, setFocusValues] = useState<number[][]>([]);

  useEffect(() => {
    if (lensSettings.focusValues) {
      setFocusValues(lensSettings.focusValues);
    } else {
      setFocusValues([]);
    }
  }, [lensSettings.focusValues]);

  const attachedLabel =
    adapter.lensAttached === null ? 'Not Attached' : adapter.lensAttached ? 'Attached' : 'Not Attached';

  const lensModel = lensInfo.xmlData?.type ? lensInfo.xmlData?.type : lensInfo.model;

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
                      <div>Main FW 0: <span className="font-mono">{lensInfo.version.main0}</span></div>
                      <div>LINK: <a className="text-blue-700" href={`/tapin/lens/${lensInfo.model}${adapter.mountType}_${byteArrayToString(lensInfo.version.main0)}.tfwf`} target="_blank" rel="noopener">{lensInfo.version.main0}</a></div>
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
                      <FocusAdjustments lensInfo={lensInfo} lensSettings={lensSettings} adapterInfo={adapter} focusValues={focusValues} onChange={setFocusValues} />

                      <hr />

                      <div>
                        <p>Focus Limits</p>
                        <img src={`/tapin/lens/tapinFocusLimit_${lensInfo.model}-${adapter.mountType}.png`} alt={`${lensInfo.model}'s focus Limit Chart`} className="w-full" />
                      </div>
                    </>
                  )}

                  <p>lensSettings:</p>
                  <JsonView value={lensSettings} className="mt-1" collapsed={2} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
