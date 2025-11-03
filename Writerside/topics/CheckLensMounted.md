# CheckLensMounted
Command Byte: `0xf7`

## Payload Structure

### Sending to TAP-in console
`0xf7`

No arguments, just used to request if a lens is attached or not

### Receiving from TAP-in console
`0xf7 <IS_ATTACHED>`

- IS_ATTACHED is a boolean value (`0x00`: false; `0x01`: true)
