// pages/api/tiktok/videos.ts or app/api/tiktok/videos/route.ts (for App Router)
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Define an interface for the expected TikTok video data structure
interface TikTokVideo {
  id: string;
  title?: string;
  video_description?: string;
  duration?: number;
  cover_image_url?: string;
  embed_link?: string;
  create_time?: number;
}

// Define an interface for the TikTok API response for video list
interface TikTokVideoListResponse {
  data: {
    videos: TikTokVideo[];
    has_more?: boolean;
    cursor?: string;
  };
  error?: {
    code: string;
    message: string;
    log_id: string;
  };
}

export async function GET() {
  const NEXTAUTH_URL = process.env.NEXTAUTH_URL;
  if (!NEXTAUTH_URL) {
    console.error("NEXTAUTH_URL is not configured.");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }

  try {
    // 1. Retrieve the access token from the cookies
    const accessToken = cookies().get("tiktok_access_token")?.value;

    if (!accessToken) {
      console.warn(
        "No TikTok access token found in cookies. User not logged in or session expired."
      );
      return NextResponse.json(
        {
          error: "Unauthorized: No TikTok session found. Please log in again.",
        },
        { status: 401 }
      );
    }

    // Define the fields as an array first for easier management
    const requestedFields = [
      "id",
      "title",
      "video_description",
      "duration",
      "cover_image_url",
      "embed_link",
      "create_time",
    ];

    // Build the query string for the fields param (comma-separated)
    const fieldsString = requestedFields.join(",");

    // 2. Call the TikTok Display API to get the user's video list
    const videoListResponse = await fetch(
      `https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(
        fieldsString
      )}`,
      {
        method: "POST", // TikTok API requires POST for video list
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          max_count: 20, // You can adjust this number (max 20 per request per docs)
        }),
      }
    );

    if (!videoListResponse.ok) {
      const errorData: { error?: { code: string; message: string } } =
        await videoListResponse.json();
      console.error("Error fetching TikTok videos:", errorData);
      // Handle specific TikTok API errors (e.g., token expired)
      if (errorData.error && errorData.error.code === "access_token_invalid") {
        return NextResponse.json(
          {
            error:
              "TikTok access token invalid or expired. Please re-authenticate.",
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "Failed to retrieve TikTok videos.", details: errorData },
        { status: videoListResponse.status }
      );
    }

    const videoData: TikTokVideoListResponse = await videoListResponse.json();
    console.log("TikTok Video Data:", videoData);

    // 3. Return the video data
    return NextResponse.json({ success: true, videos: videoData.data.videos });
  } catch (error) {
    console.error("Server error fetching TikTok videos:", error);
    return NextResponse.json(
      { error: "Internal server error.", details: error },
      { status: 500 }
    );
  }
}
