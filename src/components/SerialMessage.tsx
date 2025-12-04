import React from 'react';
import JsonView from '@uiw/react-json-view';
import {darkTheme} from "@uiw/react-json-view/dark";
import type {Message} from "../contexts/SerialContext.tsx";

type SerialMessageProps = {
  message: Message;
};

export const SerialMessage: React.FC<SerialMessageProps> = ({message}) => {
  return (
    <>
      <div key={message.id} className="mb-1">
        <div className="flex items-baseline gap-2">
      <span
        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-100`}>
        {message.from}
      </span>
          <span className="ml-1 text-sm">{message.rawHex ? `Hex: ${message.rawHex}` : message.text}</span>
        </div>
        {message.tapInMessage?.frame.header.packageIndex && (
          <div className="text-xs text-slate-500 mt-0.5">Package Index: {message.tapInMessage?.frame.header.packageIndex}</div>
        )}
        {message.tapInMessage?.frame.header.destination && (
          <div className="text-xs text-slate-500 mt-0.5">Destination: {message.tapInMessage?.frame.header.destination}</div>
        )}
        {message.tapInMessage?.frame.payload.command && (
          <div className="text-xs text-slate-500 mt-0.5">Command: {message.tapInMessage?.frame.payload.command}</div>
        )}
        {message.tapInMessage?.frame?.parsedPayload.human && (
          <div className="text-xs text-slate-500 mt-0.5">Parsed Payload: {message.tapInMessage?.frame?.parsedPayload.human}</div>
        )}
        {message.tapInMessage?.frame?.parsedPayload && (
          <JsonView value={message.tapInMessage.frame.parsedPayload} style={darkTheme} className="mt-1" collapsed={2} />
        )}
      </div>
    </>
  );
};
