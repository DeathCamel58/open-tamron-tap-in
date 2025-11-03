# GetBasicInfo
Command Byte: `0xfa`

## Payload Structure

### Sending to TAP-in console

`0xfa`

No arguments, just used to request the basic info from the lens

### Receiving from TAP-in console

- `0xfa <BASICINFODATA>` -> The [BasicInfoData](#basicinfodata) from the lens

## BasicInfoData

This contains all the settings for the lens

### From Lens

#### Structure

| Offset  | Field                   | Size | Description                                                                                                                                              |
|---------|-------------------------|------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `0-2`   | UNKNOWN                 | `3`  | Unsure, never seen these change (I only have a prime lens without any focus limiter settings)                                                            |
| `3-18`  | MODEL                   | `16` | The model number (stored using UTF-8, with null bytes after)                                                                                             |
| `19-34` | SERIAL                  | `16` | The serial number (stored using UTF-8, with null bytes after)                                                                                            |
| `35-36` | MAIN_FW_VER_0           | `2`  | The Lens firmware version                                                                                                                                |
| `37-38` | MAIN_FW_VER_1           | `2`  | UNKNOWN (This is the variable name that the OEM application uses)                                                                                        |
| `39-40` | SUB_FW_VER_0            | `2`  | UNKNOWN (This is the variable name that the OEM application uses)                                                                                        |
| `41-42` | SUB_FW_VER_1            | `2`  | UNKNOWN (This is the variable name that the OEM application uses)                                                                                        |
| `43-45` | UNKNOWN                 | `2`  |                                                                                                                                                          |
| `47-48` | HW_VER_0                | `2`  | UNKNOWN (This is the variable name that the OEM application uses)                                                                                        |
| `49-50` | CONN_VER_0              | `2`  | UNKNOWN (This is the variable name that the OEM application uses)                                                                                        |
| `51`    | ADJ_SETTINGS            | `1`  | Packed byte that stores which options are supported on this lens - Ref: [AdjSettings](#adjsettings)                                                      |
| `52`    | ADJ_VC_TYPE             | `1`  | Which VC modes are supported<br />- `0x00`: All three modes supported<br />- `0x01`: Only standard and Viewfinder image stabilization priority supported |
| `53`    | FOCUS_FOCAL_LENGTHS     | `1`  | How many different focal lengths we can configure focus adjustments on                                                                                   |
| `54`    | FOCUS_FOCAL_LENGTHS     | `1`  | How many focus adjustments we can make per focal length (NOTE: THIS IS AN EDUCATED GUESS; ONLY SEEN `0x03`)                                              |
| `55`    | FLIMIT_SWITCH_OPTIONS   | `2`  | Packed byte that stores which focus limit switch options are supported on this lens - Ref: [Focus Limit Switch Options](#focus-limit-switch-options)     |
| `56`    | FLIMIT_SWITCH_PARTITION | `1`  | UNKNOWN (This is the variable name that the OEM application uses)                                                                                        |
| `57-62` | UNKNOWN                 | `5`  |                                                                                                                                                          |
| `63`    | ADJ_FOCUS_MAX           | `1`  | The maximum value for the [Focus Adjustment Slider](SetAdjData.md#slider-value-encoding)                                                                 |
| `64`    | ADJ_FOCUS_MIN           | `1`  | The minimum value for the [Focus Adjustment Slider](SetAdjData.md#slider-value-encoding)                                                                 |
| `65-68` | FLIMIT_SWITCH_INIT      | `4`  | UNKNOWN (This is the variable name that the OEM application uses)                                                                                        |
| `69-85` | ADJ_FOCUS_INDEX         | `8`  | Likely the focal length of all 8 focus adjustment sliders. On my 45mm prime, It has 8 two byte copies of `0x45 0x00`.                                    |

#### AdjSettings

[//]: # (TODO: Document)

#### Focus Limit Switch Options

[//]: # (TODO: Document)

### From TAP-in Console

[//]: # (TODO: Document)
