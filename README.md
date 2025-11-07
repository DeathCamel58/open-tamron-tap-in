# open-tamron-tap-in

An open-source, browser-based toolkit for communicating with the Tamron TAP-in Console over the Web Serial API. Built with React, TypeScript, and Vite.

Status: experimental/alpha. This project is not affiliated with Tamron. Use at your own risk.

## What it does

- Connect to a Tamron TAP-in Console via Web Serial
- Send and receive framed messages to/from the device
- Compute and validate CRC16 checksums
- Parse selected responses (e.g., GET_STATUS for lens and console)
- Provide a simple UI with a terminal and basic controls

Under the hood:
- src/services/serialService.ts wraps the Web Serial API (open/read/write/close)
- src/drivers/tapInDriver.ts builds/parses framed packets and exposes higher-level commands
- src/util/parsers/getStatusParser.ts decodes GET_STATUS payloads into human-readable fields
- tests cover utilities and parsers (Vitest)

## Requirements

- A Chromium-based browser with Web Serial support (e.g., Chrome, Edge)
- A Tamron TAP-in Console connected via USB
- OS-level permission to access USB serial devices

Note: The SerialService currently requests a port with USB vendorId 0x2cd1 via navigator.serial.requestPort filters.

## Getting started

1) Install dependencies
- npm install

2) Run the dev server
- npm run dev
- Open the printed local URL in a supported browser

3) Connect to the TAP-in Console
- Click the connect button in the app; grant serial permission when prompted
- Use the UI to send commands (e.g., Get Status) and inspect results in the terminal/JSON view

4) Build/preview
- npm run build
- npm run preview

## Running tests

- npm test

Vitest is configured via the package.json script. Example tests live under tests/, such as:
- tests/parsers/getStatusParser.test.ts for response parsing
- tests/calcCRC16.test.ts for checksum calculation

## Project structure (high level)

- src/services/serialService.ts: Web Serial integration (open/read/write lifecycle)
- src/drivers/tapInDriver.ts: Packet framing, CRC, command helpers (power on/off, get status, etc.)
- src/components/: React UI (e.g., Terminal, Settings)
- src/util/: Utilities and parsers
- tests/: Unit tests (Vitest)

## Safety and disclaimers

- This project is unofficial and not endorsed by Tamron.
- Interacting with lenses and firmware can be risky. Avoid firmware update operations unless you fully understand the implications. You are responsible for any damage or data loss.

## Contributing

Issues and pull requests are welcome. If you have device logs or protocol findings to share, please include as much detail as possible (device model, steps taken, raw bytes when available).
