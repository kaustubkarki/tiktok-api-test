import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Retrieve the CSRF state from the cookie
  const csrfStateFromCookie = cookies().get("csrfState")?.value;

  const NEXTAUTH_URL = process.env.NEXTAUTH_URL;
  if (!NEXTAUTH_URL) {
    console.error("NEXTAUTH_URL is not configured");
    throw new Error("NEXTAUTH_URL must be set");
  }

  // --- CSRF State Verification ---
  // It's critical to compare the 'state' parameter received from TikTok
  // with the 'csrfState' stored in your cookie. If they don't match,
  // it indicates a potential Cross-Site Request Forgery (CSRF) attack.
  if (!state || state !== csrfStateFromCookie) {
    console.error("CSRF state mismatch or missing state");
    // Clear the cookie to prevent reuse
    cookies().delete("csrfState");
    return NextResponse.redirect(
      new URL("/auth/error?error=CsrfTokenMismatch", NEXTAUTH_URL)
    );
  }
  // Clear the cookie once it's validated to prevent replay attacks
  cookies().delete("csrfState");

  // --- Exchange Authorization Code for Access Token ---
  if (!code) {
    console.error("TikTok did not return an authorization code.");
    return NextResponse.redirect(
      new URL("/auth/error?error=CodeMissing", NEXTAUTH_URL)
    );
  }

  const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
  const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
  const REDIRECT_URI = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;

  if (!CLIENT_KEY || !CLIENT_SECRET || !REDIRECT_URI) {
    console.error("TikTok API credentials or redirect URI are not configured.");
    return NextResponse.redirect(
      new URL("/auth/error?error=AuthConfigError", NEXTAUTH_URL)
    );
  }

  try {
    const tokenResponse = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "no-cache", // Prevent caching
        },
        // The body must be URL-encoded as per TikTok's documentation
        body: new URLSearchParams({
          client_key: CLIENT_KEY,
          client_secret: CLIENT_SECRET,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: REDIRECT_URI,
        }).toString(),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Error exchanging code for token:", errorData);
      return NextResponse.redirect(
        new URL(
          `/auth/error?error=TokenExchangeFailed&details=${encodeURIComponent(
            JSON.stringify(errorData)
          )}`,
          NEXTAUTH_URL
        )
      );
    }

    const tokenData = await tokenResponse.json();
    console.log("TikTok Token Data:", tokenData); // Log token data for debugging (remove in production)

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in;
    // const refreshToken = tokenData.refresh_token;
    // const openId = tokenData.open_id;

    // --- Fetch User Profile (Optional but Recommended) ---
    // Use the access_token to fetch basic user information
    const userInfoResponse = await fetch(
      `https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,display_name,avatar_url`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!userInfoResponse.ok) {
      const errorInfoData = await userInfoResponse.json();
      console.error("Error fetching user info:", errorInfoData);
      // Continue without user info or handle error
    }

    const userInfo = await userInfoResponse.json();
    const tiktokUser = userInfo.data.user;
    console.log("TikTok User Info:", tiktokUser);

    // Store TikTok user data in cookies
    cookies().set("tiktok_user_data", JSON.stringify(tiktokUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    // Store access token
    cookies().set("tiktok_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: expiresIn,
      path: "/",
    });

    return NextResponse.redirect(new URL("/tiktok", NEXTAUTH_URL)); // Redirect to your dashboard or success page
  } catch (error) {
    console.error("TikTok OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/auth/error?error=OAuthFailed", NEXTAUTH_URL)
    );
  }
}
