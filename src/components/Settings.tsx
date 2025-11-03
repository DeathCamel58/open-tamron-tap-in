import React from 'react';
import { useSerial } from '../contexts/SerialContext';

export const Settings: React.FC = () => {
  const { connected } = useSerial();

  return (
    <div style={{ padding: 12 }}>
      <h3>Device</h3>
      <div>
        <strong>Status:</strong> {connected ? <span style={{ color: 'green' }}>Connected</span> : <span style={{ color: 'red' }}>Disconnected</span>}
      </div>

      <p>TODO: PROBABLY USE THIS FOR SOMEHING OR REMOVE IT</p>

      <hr style={{ margin: '12px 0' }} />
    </div>
  );
};
