export const PREVIEW_PORT = 5173;
export const PREVIEW_GATEWAY_PORT = process.env.PREVIEW_GATEWAY_PORT ?? "4001";

export const INSTALLCOMMAND = [
  "set -eu",
  "cd /workspace",
  "if [ ! -f package.json ]; then",
  "  echo 'package.json not found in /workspace' >&2",
  "  exit 1",
  "fi",
  "npm install",
].join("\n");

export const PREVIEWCOMMAND = [
  "set -eu",
  "cd /workspace",
  "if [ ! -f package.json ]; then",
  "  echo 'package.json not found in /workspace' >&2",
  "  exit 1",
  "fi",
  "npm run dev -- --host 0.0.0.0 --port 5173",
].join("\n");
