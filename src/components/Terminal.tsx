import React, {useRef} from 'react';
import {useSerial} from '../contexts/SerialContext';
import {SerialMessage} from "./SerialMessage.tsx";

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
              <SerialMessage message={m} />
            ))}
            <div ref={endRef}/>
          </div>
        </div>
      </div>
    </div>
  );
};
