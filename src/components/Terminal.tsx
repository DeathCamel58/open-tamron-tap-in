import React, {useRef} from 'react';
import {useSerial} from '../contexts/SerialContext';
import JsonView from '@uiw/react-json-view';
import {darkTheme} from "@uiw/react-json-view/dark";

export const Terminal: React.FC = () => {
  const {messages} = useSerial();
  const endRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Tap-in Console — Terminal</h2>
      </div>
      <div className="flex-1 min-h-0">
        <div className="flex flex-col flex-grow">
          <div
            style={{flex: 1, overflowY: 'auto', padding: 12, background: '#000', color: '#0f0', fontFamily: 'monospace'}}>
            {messages.map((m) => (
              <div key={m.id} className="mb-1">
                <div className="flex items-baseline gap-2">
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-100`}>
                {m.from}
              </span>
                  <span className="ml-1 text-sm">{m.rawHex ? `Hex: ${m.rawHex}` : m.text}</span>
                </div>
                {m.tapInMessage?.frame.header.packageIndex && (
                  <div className="text-xs text-slate-500 mt-0.5">Package Index: {m.tapInMessage?.frame.header.packageIndex}</div>
                )}
                {m.tapInMessage?.frame.header.destination && (
                  <div className="text-xs text-slate-500 mt-0.5">Destination: {m.tapInMessage?.frame.header.destination}</div>
                )}
                {m.tapInMessage?.frame.payload.command && (
                  <div className="text-xs text-slate-500 mt-0.5">Command: {m.tapInMessage?.frame.payload.command}</div>
                )}
                {m.tapInMessage?.frame?.parsedPayload.human && (
                  <div className="text-xs text-slate-500 mt-0.5">Parsed Payload: {m.tapInMessage?.frame?.parsedPayload.human}</div>
                )}
                {m.tapInMessage?.frame?.parsedPayload && (
                  <JsonView value={m.tapInMessage.frame.parsedPayload} style={darkTheme} className="mt-1" collapsed={2} />
                )}
              </div>
            ))}
            <div ref={endRef}/>
          </div>
        </div>
      </div>
    </div>
  );
};
