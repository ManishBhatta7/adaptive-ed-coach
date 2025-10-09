// YouTube URL types that need to be supported:
// 1. Regular videos: https://www.youtube.com/watch?v=VIDEO_ID
// 2. Shorts: https://www.youtube.com/shorts/VIDEO_ID
// 3. Short URLs: https://youtu.be/VIDEO_ID
// 4. Playlists: https://www.youtube.com/playlist?list=PLAYLIST_ID

export function extractYouTubeInfo(url: string): { type: 'video' | 'short' | 'playlist', id: string } | null {
  // For YouTube Shorts
  const shortsRegex = /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i;
  const shortsMatch = url.match(shortsRegex);
  if (shortsMatch) {
    return { type: 'short', id: shortsMatch[1] };
  }

  // For Playlists
  const playlistRegex = /[?&]list=([a-zA-Z0-9_-]+)/i;
  const playlistMatch = url.match(playlistRegex);
  if (playlistMatch) {
    return { type: 'playlist', id: playlistMatch[1] };
  }

  // For Regular Videos (including youtu.be URLs)
  const videoRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const videoMatch = url.match(videoRegex);
  if (videoMatch) {
    return { type: 'video', id: videoMatch[1] };
  }

  return null;
}