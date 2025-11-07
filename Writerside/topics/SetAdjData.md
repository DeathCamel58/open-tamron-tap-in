# SetAdjData / GetAdjData
GetAdjData: `0xfc`
SetAdjData: `0xfb`

## Payload Structure

### Sending to TAP-in console
- `0xfc` -> Request for the adjustment data<br/>No arguments, just used to request the lens be disconnected
- `0xfb <ADJDATA>` -> Set the [ADJDATA](#adjdata) on the lens


### Receiving from TAP-in console
- `0xfc <ADJDATA>` -> The [ADJDATA](#adjdata) from the lens
- `0xfb <FAILURE>` -> Whether or not a failure occurred<br/>FAILURE is a boolean value (`0x00`: no failure; `0x01`: failure)

## AdjData
This contains all of the settings for the lens

### Structure

| Offset  | Field                 | Size | Description                                                                                                                                                                                                    |
|---------|-----------------------|------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `0`     | MANUAL_FOCUS_OVERRIDE | `1`  | Full time manual focus override settings (packed byte)                                                                                                                                                         |
| `1`     | VC_MODE               | `1`  | Vibration Compensation mode selection<br/>- `0x01`: Viewfinder Priority<br/>- `0x02`: Standard Priority<br/>- `0x03`: Capturing Priority                                                                       |
| `2-10`  | UNKNOWN               | `9`  | Unsure, never seen these set or change (I only have a prime lens without any focus limiter settings)<br />Index 5 is `0x01` and index 9 is `0x01` on my lens (I would love some feedback about your lens here) |
| `11-18` | FOCUS_ADJUSTMENT_1    | `8`  | The [focus adjustments](#focus-adjustments) for the closest focus                                                                                                                                              |
| `19-26` | FOCUS_ADJUSTMENT_2    | `8`  | The [focus adjustments](#focus-adjustments) for the medium distance focus                                                                                                                                      |
| `27-34` | FOCUS_ADJUSTMENT_3    | `8`  | The [focus adjustments](#focus-adjustments) for the farthest focus                                                                                                                                             |

### Focus Adjustments

For focus adjustments, each of the 8 bytes corresponds to a slider position.

![](F013 Focus Adjustment.png)

In this image:
- `FOCUS_ADJUSTMENT_1` refers to the `0.29 m` focus options
- `FOCUS_ADJUSTMENT_2` refers to the `0.77 m` focus options
- `FOCUS_ADJUSTMENT_3` refers to the `Infinite m` focus options

Each of the `FOCUS_ADJUSTMENT_<N>` fields contains 8 bytes. Each byte correlates to a slider from top to bottom.

### Focus adjustment value encoding

### Slider Value Encoding

Each slider value is represented by a single signed byte (int8).  
Positive values are stored directly, while negative values use two’s complement encoding.

For example:

| Slider Position | Byte (Hex) | Byte (Decimal) | Notes                    |
|-----------------|------------|----------------|--------------------------|
| -20 (leftmost)  | `0xEC`     | 236            | Two’s complement for -20 |
| -10 (half-left) | `0xF6`     | 246            | Two’s complement for -10 |
| 0 (center)      | `0x00`     | 0              | Two’s complement for 0   |
| 20 (rightmost)  | `0x14`     | 20             | Two’s complement for 20  |

[//]: # (TODO: Include example)
