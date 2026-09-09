export function playlistUrl(masterPlaylistKey: string) {
  const baseUrl = process.env.NEXT_PUBLIC_S3_PREVIEW_BASE_URL;

  if (!baseUrl) {
    return "";
  }

  return `${baseUrl.replace(/\/$/, "")}/${masterPlaylistKey}`;
}