const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export async function getPlaylistVideos(playlistId: string): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = [];
  let nextPageToken = '';

  do {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}&pageToken=${nextPageToken}`
    );
    const data = await response.json();
    
    const videoIds = data.items.map((item: any) => item.contentDetails.videoId).join(',');
    const videoDetailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );
    const videoDetails = await videoDetailsResponse.json();

    videos.push(
      ...data.items.map((item: any, index: number) => ({
        id: item.contentDetails.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        duration: videoDetails.items[index].contentDetails.duration,
        publishedAt: item.snippet.publishedAt
      }))
    );

    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return videos;
}

export async function getVideoTranscript(videoId: string): Promise<string> {
  // You'll need to implement this using a transcript API or service
  // For example, you could use the YouTube Data API captions endpoint
  // or a third-party service like AssemblyAI
  return '';
}

export async function generateContentMetadata(
  video: YouTubeVideo,
  transcript: string
): Promise<ContentMetadata> {
  // This function will use your AI agent to analyze the video content
  // and generate metadata, summaries, and quiz questions
  // Implement your AI processing logic here
  return {
    title: video.title,
    description: video.description,
    subject_area: '',
    grade_level: '',
    difficulty_level: '',
    learning_objectives: [],
    keywords: [],
    video_url: `https://www.youtube.com/watch?v=${video.id}`,
    transcript,
    ai_summary: '',
    ai_key_points: [],
    ai_quiz_questions: []
  };
}