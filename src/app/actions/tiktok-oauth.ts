"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function initiateTikTokLogin() {
  // Generate a random CSRF state to prevent Cross-Site Request Forgery (CSRF) attacks.
  // This value will be stored in a cookie and compared against the 'state' parameter
  // returned by TikTok after the user authorizes your application.
  const csrfState =
    Math.random().toString(36).substring(2) + Date.now().toString(36);

  // Set the CSRF state in a secure, HTTP-only cookie.
  // The maxAge ensures the cookie expires after a reasonable time.
  cookies().set("csrfState", csrfState, {
    maxAge: 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI?.startsWith("https"),
    path: "/",
  });

  // Retrieve environment variables. Ensure these are set in your .env.local file.
  const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
  const REDIRECT_URI = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;

  // Basic validation for environment variables.
  if (!CLIENT_KEY || !REDIRECT_URI) {
    throw new Error(
      "TikTok API credentials or redirect URI are not configured."
    );
  }

  // Construct the TikTok authorization URL.
  // The parameters must be correctly formatted according to TikTok's API documentation.
  let tiktokAuthUrl = "https://www.tiktok.com/v2/auth/authorize/";

  tiktokAuthUrl += `?client_key=${CLIENT_KEY}`;
  tiktokAuthUrl += "&scope=user.info.basic,video.list";
  tiktokAuthUrl += "&response_type=code";
  tiktokAuthUrl += `&redirect_uri=${REDIRECT_URI}`;
  tiktokAuthUrl += `&state=${csrfState}`;

  redirect(tiktokAuthUrl);
}
