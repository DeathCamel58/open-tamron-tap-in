# Serial Frames

The TAP-in Utility's serial data frames have this general structure:

NOTE: All data is little endian.

`<HEADER><PAYLOAD><CRC><POSTAMBLE>`

## Header Structure

| Offset | Field          | Size | Description                                                              |
|--------|----------------|------|--------------------------------------------------------------------------|
| `0`    | PREAMBLE       | `1`  | Always `0x0f`                                                            |
| `1`    | Packet Index   | `1`  | Starts at `0x01`, same value for frame and its response, then increments |
| `2-3`  | Device Address | `1`  | `0x00 0x00` is the lens <br /> `0x01 0x00` is the TAP-in console         |
| `4-5`  | Length         | `2`  | The length of the payload being sent                                     |

### Examples {collapsible="true"}

`0f 02 01 00 02 00 f7 01 9e 8b f0`

- Packet Index: `2`
- Device Address: `1` (console)
- Length: `2` bytes

`0f 0e 00 00 24 00 fc 02 02 00 00 00 01 00 00 00 01 00 ec 00 00 00 00 00 00 00 14 00 00 00 00 00 00 00 ec 00 00 00 00 00 00 00 b9 87 f0`

- Packet Index: `14`
- Device Address: `0` (lens)
- Length: `36` bytes

## Payloads:

Payload data changes drastically based on the command type. Each command has its own page for reference:

- [](CheckLensMounted.md): `0xf7`
- [](RequestLensConnect.md): `0xf8`
- [](RequestLensDisconnect.md): `0xf9`
- [](GetBasicInfo.md): `0xfa`
- [SetAdjData](SetAdjData.md): `0xfb`
- [GetAdjData](SetAdjData.md): `0xfc`
- [](UpdateFirmware.md): `0xfd`
- [Unknown](#unknown-command-0xfe): `0xfe`
- [](CommError.md): `0xff`

A couple thoughts I have about this:

- `0xf7` is a weird number to start on. It only makes sense to me for the developers to have chosen it if they were
  counting down from `0xff` on the payload types. `0xf6` to both the lens and the TAP-in console yields an error. Still
  worth looking into as the payload could require extra options.

### Unknown command `0xfe`

Sending the command `0xfe` to the lens yields an error response. Sending the `0xfe` command to the console yields the
response:
`0f 09 01 00 21 00 fe 48 26 96 f3 ff ff ff ff ff ff ff ff ff ff ff ff 28 2e 03 ff ff ff ff ff ff ff ff ff ff ff ff ff 03 bc f0`
