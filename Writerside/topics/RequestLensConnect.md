# RequestLensConnect
Command Byte: `0xf8`

## Payload Structure

### Sending to TAP-in console
`0xf8 0x00`

No arguments, just used to request the lens be connected

### Receiving from TAP-in console
`0xf8 <IS_CONNECTED>`

- IS_CONNECTED is a boolean value (`0x00`: false; `0x01`: true)

As a note, this command doesn't produce an error if called when already disconnected.
