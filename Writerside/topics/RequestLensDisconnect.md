# RequestLensDisconnect
Command Byte: `0xf9`

## Payload Structure

### Sending to TAP-in console
`0xf9`

No arguments, just used to request the lens be disconnected

### Receiving from TAP-in console
`0xf9 <IS_DISCONNECTED>`

- IS_DISCONNECTED is a boolean value (`0x00`: false; `0x01`: true)

As a note, this command doesn't produce an error if called when already disconnected.
