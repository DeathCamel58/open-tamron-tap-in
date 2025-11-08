import React, {useEffect, useState} from "react";
import {focusByteToNumber, focusNumberToByte} from "../util/focusByte.ts";
import type {LensInfo} from "../types/LensInfo.ts";
import type {AdapterInfo} from "../types/AdapterInfo.ts";

type FocusAdjustmentsProps = {
  lensInfo: LensInfo;
  adapterInfo: AdapterInfo;
  focusValues: number[][];
  onChange: (newValues: number[][]) => void;
  // Optional: notify parent which data row (0-based) is currently active (focus/hover)
  onActiveRowChange?: (rowIndex: number) => void;
};

export const FocusAdjustments: React.FC<FocusAdjustmentsProps> = ({
  lensInfo,
  adapterInfo,
  focusValues,
  onChange,
  onActiveRowChange,
}) => {
  const cols = 3; // Short, Medium, Long
  const step = 1;

  const [min, setMin] = useState<number>(0);
  const [max, setMax] = useState<number>(0);
  const [rows, setRows] = useState<number>(8);

  useEffect(() => {
    setMin(lensInfo.adjFocusMin ? lensInfo.adjFocusMin : 0);
  }, [lensInfo.adjFocusMin]);

  useEffect(() => {
    setMax(lensInfo.adjFocusMax ? lensInfo.adjFocusMax : 0);
  }, [lensInfo.adjFocusMax]);

  useEffect(() => {
    setRows(lensInfo.focusFocalLengths ? lensInfo.focusFocalLengths : 0);
  }, [lensInfo.focusFocalLengths]);

  // helper to update a single value at column c and row r (data rows only)
  // Accepts human-domain value (min..max). Stores encoded byte in the underlying array.
  const updateValueAt = (c: number, r: number, nvHuman: number) => {
    if (r < 0) return; // guard for header row
    const rounded = Math.round(nvHuman / step) * step;
    const clampedHuman = Math.min(max, Math.max(min, rounded));
    const encoded = focusNumberToByte(clampedHuman);

    const newValues = focusValues.map((col) => [...(col ?? [])]); // shallow clone each column
    if (!newValues[c]) newValues[c] = Array.from({ length: rows }, () => focusNumberToByte(min));
    newValues[c][r] = encoded;
    onChange(newValues);
  };

  const valuesPopulated = () => {
    return focusValues.length > 0;
  }

  // Labels for header/hardcoded first row and label column
  const columnHeader = (c: number) => (['Short', 'Medium', 'Long'][c] ?? `C${c+1}`);
  const rowLabel = (r: number) => {
    if (lensInfo.xmlData) {
      const mm = lensInfo.xmlData.adjFocusIndex?.[r];
      return typeof mm === 'string' ? `${mm}mm` : `Row ${r + 1}`;
    } else {
      return 'Unknown'
    }
  };

  const displayRows = rows + 1; // extra header row on top

  return (
    <div>
      <p>Focus Adjustments</p>
      <div className="w-full">
        {valuesPopulated() ? (
          <div
            className="grid gap-y-2"
            style={{ gridTemplateColumns: `repeat(${cols + 1}, minmax(0, 1fr))` }}
          >
            {/* Image row: leave column 1 empty so image aligns with data columns 2–4 */}
            <div />
            <div className="col-start-2 col-span-3">
              <img src={`/webapp/tapin/lens/tapinFocusAdjustment_${lensInfo.model}-${adapterInfo.mountType}.png`} alt={`${lensInfo.model}'s focus adjustment chart`} className="w-full" />
            </div>

            {/* Render per-row to keep heights aligned across all columns */}
            {Array.from({ length: displayRows }).map((_, rIdx) => {
              const r = rIdx - 1; // data row index (0..rows-1), header row == -1
              return (
                <React.Fragment key={`row-${rIdx}`}>
                  {/* Label cell (column 1) */}
                  <div className="bg-white p-3 flex items-center border-b">
                    <div className="text-xs font-semibold text-slate-600">
                      {rIdx === 0 ? 'Adjustment' : rowLabel(r)}
                    </div>
                  </div>

                  {/* Data cells (columns 2-4) */}
                  {Array.from({ length: cols }).map((__, c) => {
                    const idx = c * rows + (r >= 0 ? r : 0); // stable key base
                    const val = r >= 0
                      ? focusByteToNumber(focusValues?.[c]?.[r] ?? focusNumberToByte(min))
                      : 0;

                    if (rIdx === 0) {
                      // Header row: hardcoded content per column
                      return (
                        <div key={`h-${c}`} className="p-3 flex items-center justify-center border-b">
                          <div className="text-xs font-semibold text-slate-700">{columnHeader(c)}</div>
                        </div>
                      );
                    }

                    return (
                      <div key={`${c}-${idx}`} className="bg-white p-3 flex items-center border-b" onMouseEnter={() => onActiveRowChange?.(r)}>
                        <div className="flex-1">
                          <input
                            type="number"
                            value={val}
                            min={min}
                            max={max}
                            step={step}
                            onFocus={() => onActiveRowChange?.(r)}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              if (!Number.isNaN(n)) updateValueAt(c, r, n);
                            }}
                            onBlur={(e) => {
                              const n = Number(e.target.value);
                              if (!Number.isNaN(n)) updateValueAt(c, r, n);
                            }}
                            className="w-full rounded-md border px-2 py-1 text-sm"
                            aria-label={`Value input ${idx + 1}`}
                          />
                          <input
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={val}
                            onChange={(e) => updateValueAt(c, r, Number(e.target.value))}
                            onMouseDown={() => onActiveRowChange?.(r)}
                            className="w-full h-2 rounded-lg accent-sky-600"
                            aria-label={`Slider ${idx + 1}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <>
            <p>Focus Values not set!</p>
          </>
        )}
      </div>
    </div>
  );
};
