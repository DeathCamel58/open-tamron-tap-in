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

Payload data changes drastically based on the payload type I've put those in their own pages for reference:

- [CheckLensMounted](CheckLensMounted.md): `0xf7`
- [RequestLensConnect](RequestLensConnect.md): `0xf8`
- [RequestLensDisconnect](RequestLensDisconnect.md): `0xf9`
- [GetBasicInfo](GetBasicInfo.md): `0xfa`
- [SetAdjData](SetAdjData.md): `0xfb`
- [GetAdjData](SetAdjData.md): `0xfc`
- UpdateFirmware: `0xfd`
- [CommError](CommError.md): `0xff`

A couple thoughts I have about this:

- `0xf7` is a weird number to start on. It only makes sense to me for the developers to have chosen it if they were
  counting down from `0xff` on the payload types
- `0xfe` is skipped. Maybe there's an unused type here?
