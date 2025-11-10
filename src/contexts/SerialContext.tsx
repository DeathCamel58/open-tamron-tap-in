import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { SerialService } from '../services/serialService';
import { TapInDriver } from '../drivers/tapInDriver';
import type { TapInMessage } from '../types/tapIn';
import { CommandByte } from '../util/CommandBytes.ts';
import type {LensInfo} from "../types/LensInfo.ts";
import type {AdapterInfo} from "../types/AdapterInfo.ts";
import type {LensSettings} from "../types/LensSettings.ts";
import { setLensInfo as setGlobalLensInfo, setAdapterInfo as setGlobalAdapterInfo, setLensSettings as setGlobalLensSettings, resetLensInfo as resetGlobalLensInfo, resetLensSettings as resetGlobalLensSettings } from '../state/deviceState';

// Terminal message type
type Message = {
  id: string;
  from: 'system' | 'host' | 'console';
  text: string | null;
  ts: number;
  rawHex?: string;
  description?: string | null;
  tapInMessage?: TapInMessage;
};

type SerialContextType = {
  messages: Message[];
  adapter: AdapterInfo;
  lensInfo: LensInfo;
  lensSettings: LensSettings;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendLine: (line: string) => Promise<void>;
  clearMessages: () => void;
  // high-level driver methods
  powerOn: () => Promise<void>;
  powerOff: () => Promise<void>;
  getStatus: () => Promise<void>;
  getStatusLens: () => Promise<void>;
  checkLensAttached: () => Promise<void>;
  getSettings: () => Promise<void>;
  sendFE: () => Promise<void>;
  updateSettings: (settings: LensSettings) => Promise<void>;
};

const SerialContext = createContext<SerialContextType | undefined>(undefined);

export const useSerial = () => {
  const ctx = useContext(SerialContext);
  if (!ctx) throw new Error('useSerial must be used inside SerialProvider');
  return ctx;
};

export const SerialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [adapter, setAdapter] = useState<AdapterInfo>({ connected: false });
  const [lensInfo, setLensInfo] = useState<LensInfo>({});
  const [lensSettings, setLensSettings] = useState<LensSettings>({});
  const messagesRef = useRef<Message[]>([]);

  // Use refs to ensure single instances across re-renders
  const serialServiceRef = useRef<SerialService | null>(null);
  const driverRef = useRef<TapInDriver | null>(null);

  // Initialize once
  if (!serialServiceRef.current) {
    serialServiceRef.current = new SerialService();
  }
  if (!driverRef.current) {
    driverRef.current = new TapInDriver(serialServiceRef.current);
  }

  const serialService = serialServiceRef.current;
  const driver = driverRef.current;

  useEffect(() => {
    driver.setMessageHandler((m: TapInMessage) => {
      console.log('SerialContext: driver message handler', m);

      // Push terminal message
      setMessages((prev) => {
        const newMessages = [
          ...prev,
          {
            id: m.id,
            from: m.from,
            text: m.parsed,
            ts: m.ts,
            rawHex: Array.from(m.frame.raw).map((b) => b.toString(16).padStart(2, '0')).join(' '),
            description: m.description,
            tapInMessage: m,
          },
        ];
        messagesRef.current = newMessages;
        return newMessages;
      });

      // Update lens info when relevant
      const parsed = m.frame?.parsedPayload;
      const cmd = parsed?.cmd as number | undefined;
      const details: any = parsed?.details ?? {};

      // Only update the lens/adapter data based on responses
      if (m.from === "console") {
        switch (cmd) {
          case CommandByte.GET_STATUS:
            // Update the adapter or lens information immutably
            if (details.type === "TAP-in Console") {
              setAdapter((prev) => {
                const next = {
                  ...prev,
                  firmwareVersion: details.firmware_version,
                  mountType: details.mounted,
                  hardwareVersion: details.hardware_version,
                  connectedVersion: details.connection_version,
                } as AdapterInfo;
                setGlobalAdapterInfo(next);
                return next;
              });

              checkLensAttached();
            } else if (details.type === "Lens") {
              // Map parsed details to LensInfo shape and update immutably
              setLensInfo((prev) => {
                const next = {
                  ...prev,
                  // Basic identity
                  lensAttachedConversionLensID: details.lensAttachedConversionLensID ?? prev.lensAttachedConversionLensID,
                  type: details.lensType ?? prev.type,
                  model: details.model ?? prev.model,
                  serial: details.serial ?? prev.serial,
                  // Versions
                  version: {
                    ...prev.version,
                    main0: details.version?.main0 ?? details.lensMainFwVer0 ?? prev.version?.main0,
                    main1: details.version?.main1 ?? details.lensMainFwVer1 ?? prev.version?.main1,
                    sub0: details.version?.sub0 ?? details.lensSubFwVer0 ?? prev.version?.sub0,
                    sub1: details.version?.sub1 ?? details.lensSubFwVer1 ?? prev.version?.sub1,
                    hw: details.version?.hw ?? details.lensHwVer ?? prev.version?.hw,
                    conn: details.version?.conn ?? details.lensConnVer ?? prev.version?.conn,
                  },
                  // Focus-related fields (if present)
                  focus: {
                    ...prev.focus,
                    adjFocus: details.focus?.adjFocus ?? prev.focus?.adjFocus,
                    adjFtm: details.focus?.adjFtm ?? prev.focus?.adjFtm,
                    adjFlimitSw: details.focus?.adjFlimitSw ?? prev.focus?.adjFlimitSw,
                    adjVc: details.focus?.adjVc ?? prev.focus?.adjVc,
                  },
                  adjVcType: details.adjVcType ?? prev.adjVcType,
                  focusFocalLengths: details.focusFocalLengths ?? prev.focusFocalLengths,
                  focusPerFocalLength: details.focusPerFocalLength ?? prev.focusPerFocalLength,
                  flimitSwNum: details.flimitSwNum ?? prev.flimitSwNum,
                  flimitSwType: details.flimitSwType ?? prev.flimitSwType,
                  flimitSwMode: details.flimitSwMode ?? prev.flimitSwMode,
                  flimitSwPartition: details.flimitSwPartition ?? prev.flimitSwPartition,
                  adjFocusMax: details.adjFocusMax ?? prev.adjFocusMax,
                  adjFocusMin: details.adjFocusMin ?? prev.adjFocusMin,
                  flimitSwInit: details.flimitSwInit ?? prev.flimitSwInit,
                  adjFocusIndex: details.adjFocusIndex ?? prev.adjFocusIndex,
                  xmlData: details.xmlData ?? prev.xmlData,
                } as LensInfo;
                setGlobalLensInfo(next);
                return next;
              });
              getSettings();
            }
            break;
          case CommandByte.GET_SETTINGS:
            // TODO: First GET_SETTINGS fails.
            //       This is because the lensInfo is `{}`
            // Update lens settings immutably (including vcModes)
            setLensSettings((prev) => {
              const next = {
                ...prev,
                fullTimeManualFocusOverride: details.fullTimeManualFocusOverride ?? prev.fullTimeManualFocusOverride,
                vcModes: details.vcModes ?? prev.vcModes,
                vcMode: details.vcMode ?? prev.vcMode,
                focusValues: details.focusValues ?? prev.focusValues,
              } as LensSettings;
              setGlobalLensSettings(next);
              return next;
            });
            break;
          case CommandByte.SET_SETTINGS:
            // When we receive a response after pushing settings, ask lens for current settings
            getSettings();

            break;
          case CommandByte.IS_LENS_ATTACHED:
            setAdapter((prev) => ({ ...prev, lensAttached: details.attached }));
            setGlobalAdapterInfo({ lensAttached: details.attached });
            if (details.attached) {
              powerOn();
            } else {
              checkLensAttached();
            }
            break;
          case CommandByte.POWER_ON:
            if (details.power_on) {
              getStatusLens();
            } else {
              console.error("Lens: Power on failed")
            }
            break;
          case CommandByte.ERROR:
            {
              const previousMessage = messagesRef.current[messagesRef.current.length - 1].tapInMessage;

              if (previousMessage) {
                const previousParsed = previousMessage.frame?.parsedPayload;
                const previousCmd = previousParsed?.cmd as number | undefined;

                console.log(`Error RX'd. Previous cmd: ${previousCmd}`);
                switch (previousCmd) {
                  case CommandByte.POWER_ON:
                    // Power off and start the checkLensAttached loop
                    powerOff();
                    checkLensAttached();
                    break;
                  case CommandByte.GET_SETTINGS:
                    checkLensAttached();
                    // Start the checkLensAttached loop
                    break;
                  case CommandByte.GET_STATUS:
                    if (previousMessage.frame.header.destination === "Lens") {
                      checkLensAttached();
                    }
                    // Unsure what to do if the GET_STATUS error was from the TAP-in console
                    break;
                  case CommandByte.ERROR:
                    // Multiple errors in a row; give up
                    console.log("Error RX'd too many times. Messages:", messagesRef.current);

                    break;
                }
              } else {
                console.log("Error RX'd, no previous message.")
              }
            }
            break;
        }
      }
    });

    // cleanup on unmount
    return () => {
      // TODO: Can't disconnect from adapter
      driver.setMessageHandler(null);
      serialService.onStatus = null;
    };
  }, [driver, serialService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      serialService.close().catch(() => {});
    };
  }, [serialService]);

  const connect = async () => {
    try {
      await serialService.requestAndOpenPort();
      setMessages((p) => [...p, { id: crypto.randomUUID(), from: 'system', text: 'Connected', ts: Date.now() }]);
      // set adapter connected status
      setAdapter((prev) => ({ ...prev, connected: true }));
      setGlobalAdapterInfo({ connected: true });
    } catch (err: any) {
      setMessages((p) => [
        ...p,
        { id: crypto.randomUUID(), from: 'system', text: `Connect error: ${err?.message ?? err}`, ts: Date.now() },
      ]);
      throw err;
    }
  };

  const disconnect = async () => {
    await serialService.close();
    setMessages((p) => [...p, { id: crypto.randomUUID(), from: 'system', text: 'Disconnected', ts: Date.now() }]);
    setLensInfo({});
    setLensSettings({});
    setAdapter((prev) => ({ ...prev, connected: false, lensAttached: null }));
    // Mirror to global device state
    resetGlobalLensInfo();
    resetGlobalLensSettings();
    setGlobalAdapterInfo({ connected: false, lensAttached: null });
  };

  const sendLine = async (line: string) => {
    // send as a normal ASCII line (host convenience)
    await driver.sendBytes(new TextEncoder().encode(line + '\n'));
  };

  const clearMessages = () => setMessages([]);

  // driver high-level wrappers
  const powerOn = async () => driver.powerOn();
  const powerOff = async () => driver.powerOff();
  const getStatus = async () => driver.getStatus();
  const getStatusLens = async () => driver.getStatusLens();
  const checkLensAttached = async () => driver.checkLensAttached();
  const getSettings = async () => driver.getSettings();
  const sendFE = async () => driver.sendFE();
  const updateSettings = async (settings: LensSettings) => driver.updateSettings(settings);

  return (
    <SerialContext.Provider
      value={{ messages, adapter, lensInfo, lensSettings, connect, disconnect, sendLine, clearMessages, powerOn, powerOff, getStatus, getStatusLens, checkLensAttached, getSettings, sendFE, updateSettings }}
    >
      {children}
    </SerialContext.Provider>
  );
};
