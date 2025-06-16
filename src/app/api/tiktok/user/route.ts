import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const tiktokUserData = cookies().get("tiktok_user_data")?.value;

    if (!tiktokUserData) {
      return NextResponse.json(
        { error: "TikTok user data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(JSON.parse(tiktokUserData));
  } catch (error) {
    console.error("Error fetching TikTok user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch TikTok user data" },
      { status: 500 }
    );
  }
}