export function extractVideoId(url: string): string | null {
  const patterns = [
    /^.*(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^?&#]*)/,
    /^.*(?:youtube\.com\/shorts\/)([^?&#]*)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export async function getVideoDetails(videoId: string) {
  try {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch video details');
    }

    const data = await response.json();
    return data.items[0] || null;
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
}