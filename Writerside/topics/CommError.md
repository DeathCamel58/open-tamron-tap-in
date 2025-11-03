# CommError
Command Byte: `0xff`

## Payload Structure

`0xff 0x10`

I'd imagine that `0x10` is the error type, but I haven't been able to observe it change, so it may be constant.

Observed under:
- Requesting a lens connect while already connected
- Getting the basic info of a lens while no lens is connected
- Getting the settings of a lens while no lens is connected
