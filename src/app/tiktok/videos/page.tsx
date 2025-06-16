"use client";
import React, { useEffect, useState } from "react";

// Define an interface for the expected TikTok video data structure
// This should match the interface used in your API route for consistency
interface TikTokVideo {
  id: string;
  title?: string;
  video_description?: string;
  duration?: number;
  cover_image_url?: string;
  embed_link?: string; // Crucial for embedding
  create_time?: number;
}

const TikTokDashboard: React.FC = () => {
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTikTokVideos() {
      try {
        setLoading(true);
        // Call your Next.js API route to get video data
        const response = await fetch("/api/tiktok/videos");
        const data = await response.json();

        if (response.ok) {
          // Filter out videos that do not have an embed_link or id
          const playableVideos = data.videos.filter(
            (video: TikTokVideo) => video.embed_link && video.id
          );
          setVideos(playableVideos);
        } else {
          setError(data.error || "An unknown error occurred.");
        }
      } catch (err) {
        console.error("Client-side fetch error:", err);
        setError("Failed to connect to the server: " + err);
      } finally {
        setLoading(false);
      }
    }

    fetchTikTokVideos();
  }, []); // Empty dependency array means this effect runs once after initial render

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        <p className="ml-4 text-lg">Loading TikTok videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-red-600">
        <p className="text-xl font-bold">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 font-inter text-gray-800 dark:text-gray-200">
      <h1 className="text-4xl font-extrabold text-center mb-10 text-purple-600 dark:text-purple-400">
        Your TikTok Video Feed
      </h1>

      {videos.length === 0 ? (
        <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No public videos found or you haven&apos;t posted any yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-6 flex flex-col items-center"
            >
              {/* Using iframe to embed the TikTok player */}
              {video.embed_link ? (
                <div
                  className="w-full relative"
                  style={{
                    paddingBottom:
                      "177.77%" /* 9:16 aspect ratio (9 / 16 * 100) */,
                  }}
                >
                  <iframe
                    src={video.embed_link}
                    title={video.title || "TikTok Video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    style={{ border: "none" }} 
                  ></iframe>
                </div>
              ) : (
                <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>Video player unavailable</p>
                </div>
              )}

              <div className="mt-6 text-center w-full">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {video.title || "Untitled Video"}
                </h2>
                {video.video_description && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-3">
                    {video.video_description}
                  </p>
                )}
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  Duration:{" "}
                  {video.duration ? `${video.duration} seconds` : "N/A"}
                </p>
                {/* Optional: Add a link back to TikTok if embed fails or for full experience */}
                <a
                  href={`https://www.tiktok.com/@yourusername/video/${video.id}`} // Replace 'yourusername' with actual user's TikTok username
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-full transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  View on TikTok
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TikTokDashboard;
