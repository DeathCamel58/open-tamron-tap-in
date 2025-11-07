export function byteArrayToString(
  data: ArrayLike<number>,
  separator: string = "",
  prefix: string = "",
  uppercase: boolean = false,
  pad: number = 2,
): string {
  if (!data) return "";
  return Array.from(data)
    .map((b) => {
      let hex = b.toString(16).padStart(pad, "0");
      if (uppercase) hex = hex.toUpperCase();
      return prefix + hex;
    })
    .join(separator);
}
