import React from 'react';
import { useSerial } from '../contexts/SerialContext';
import JsonView from "@uiw/react-json-view";

export const Adapter: React.FC = () => {
  const { adapter, checkLensAttached, connect, disconnect, getSettings, getStatus, getStatusLens, powerOn, powerOff } = useSerial();

  const handleConnect = async () => {
    try {
      await connect();

      // Request the adapter status after connecting
      await getStatus();
    } catch (e) {
      console.error(e);
      alert('Failed to connect: ' + String(e));
    }
  };

  const attachedLabel =
    adapter.connected === null ? 'Unknown' : adapter.connected ? 'Attached' : 'Not Attached';

  let mountName;
  switch (adapter.mountType) {
    case "E0":
      mountName = "Canon";
      break;
    case "N0":
      mountName = "Nikon";
      break;
    case "S0":
      mountName = "Sony";
      break;
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-5">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Adapter - {attachedLabel}</h2>
      </div>
      <div className="flex-1 min-h-0">
        <div className="px-6 py-4 border-b bg-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2 mt-2">
                <div>
                  {!adapter.connected ? (
                    <button onClick={handleConnect} className="px-3 py-2 rounded bg-white border">Connect (select port)</button>
                  ) : (
                    <button onClick={() => disconnect()} className="px-3 py-2 rounded bg-white border">Disconnect</button>
                  )}
                </div>
              </div>

              <hr style={{ margin: '12px 0' }} />

              <div className="flex flex-wrap gap-2 mt-2">
                <div>
                  Adapter Information:
                </div>

                <hr />

                <div>
                  {!adapter.connected ? (
                    <div>Disconnected!</div>
                  ) : (
                    <>
                      <p>Firmware Version: {adapter.firmwareVersion}</p>
                      <p>Hardware Version: {adapter.hardwareVersion}</p>
                      <p>Connected Version: {adapter.connectedVersion}</p>
                      <p>Mount Type: {adapter.mountType} ({mountName})</p>
                    </>
                  )}
                </div>
              </div>

              <hr style={{ margin: '12px 0' }} />

              <div className="flex flex-wrap gap-2 mt-2">
                <div>
                </div>

                <hr />

                <div>
                  <button onClick={() => getStatus()} disabled={!adapter.connected} className="px-3 py-2 rounded bg-white border">Get Status</button>
                  <button onClick={() => getStatusLens()} disabled={!adapter.connected} className="px-3 py-2 rounded bg-white border">Get Status - Lens</button>
                  <button onClick={() => checkLensAttached()} disabled={!adapter.connected} className="px-3 py-2 rounded bg-white border">Check Lens Attached</button>
                  <button onClick={() => powerOn()} disabled={!adapter.connected} className="px-3 py-2 rounded bg-white border">Power On</button>
                  <button onClick={() => powerOff()} disabled={!adapter.connected} className="px-3 py-2 rounded bg-slate-100 border">Power Off</button>
                  <button onClick={() => getSettings()} disabled={!adapter.connected} className="px-3 py-2 rounded bg-white border">Get Settings</button>
                </div>
              </div>

              <hr />

              <JsonView value={adapter} className="mt-1" collapsed={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
