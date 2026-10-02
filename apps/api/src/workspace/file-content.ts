export function normalizeTextContent(content: Buffer): Buffer {
  // UTF-8 BOM
  if (
    content.length >= 3 &&
    content[0] === 0xef &&
    content[1] === 0xbb &&
    content[2] === 0xbf
  ) {
    return content.subarray(3);
  }

  // UTF-16 LE BOM
  if (content.length >= 2 && content[0] === 0xff && content[1] === 0xfe) {
    return Buffer.from(content.subarray(2).toString("utf16le"), "utf8");
  }

  // UTF-16 BE BOM
  if (content.length >= 2 && content[0] === 0xfe && content[1] === 0xff) {
    const bytes = content.subarray(2);

    for (let i = 0; i + 1 < bytes.length; i += 2) {
      const temp = bytes[i];
      bytes[i] = bytes[i + 1];
      bytes[i + 1] = temp;
    }

    return Buffer.from(bytes.toString("utf16le"), "utf8");
  }

  return content;
}
