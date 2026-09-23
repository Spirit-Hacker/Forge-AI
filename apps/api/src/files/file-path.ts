export function validateProjectPath(input: string): string {
  if (typeof input !== "string") {
    throw new Error("Invalid file path");
  }

  const path = input.trim();

  if (!path) {
    throw new Error("File path is required");
  }

  // Null byte protection
  if (path.includes("\0")) {
    throw new Error("Invalid file path");
  }

  // Convert Windows separators
  const normalized = path.replaceAll("\\", "/");

  // Reject absolute paths
  if (normalized.startsWith("/")) {
    throw new Error("Absolute paths are not allowed");
  }

  // Reject Windows absolute paths like C:/...
  if (/^[a-zA-Z]:\//.test(normalized)) {
    throw new Error("Absolute paths are not allowed");
  }

  const parts = normalized.split("/");

  // Reject traversal
  if (parts.some((part) => part === "..")) {
    throw new Error("Path traversal is not allowed");
  }

  // Remove empty segments
  const cleanParts = parts.filter(Boolean);

  if (cleanParts.length === 0) {
    throw new Error("Invalid file path");
  }

  return cleanParts.join("/");
}
