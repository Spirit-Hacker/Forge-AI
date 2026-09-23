export function projectFileVersionObjectKey(
  projectId: string,
  fileId: string,
  version: number,
) {
  return `projects/${projectId}/files/${fileId}/versions/${version}`;
}
