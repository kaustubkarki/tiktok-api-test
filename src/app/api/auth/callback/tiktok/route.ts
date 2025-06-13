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
    const refreshToken = tokenData.refresh_token;
    const openId = tokenData.open_id;

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

    // --- Create/Update Session in NextAuth.js ---
    // You will need to "create" a session using NextAuth.js's internal mechanisms.
    // Since NextAuth.js v4 doesn't provide a direct `createSession` function to use externally
    // in this way for custom providers, you'll typically manage the session manually
    // or set cookies that NextAuth.js can pick up.
    // A common pattern is to simply redirect to a NextAuth.js `signin` endpoint
    // with the provider ID and user data, allowing it to handle session creation.

    // For a manual flow like this, you can:
    // 1. Store the access token and user info in your own database associated with a user.
    // 2. Then, create your own session cookie or simply redirect to a page that
    //    can then fetch the session from your database (if you integrate one).

    // A simpler approach for immediate testing with NextAuth.js's SessionProvider:
    // This is a "hacky" way to make NextAuth.js aware of the session for a custom flow.
    // It's not ideal for long-term production, but good for understanding.
    // For robust production, integrate a database adapter with NextAuth.js.

    // For now, let's just demonstrate a successful redirect to a dashboard
    // and consider how to actually integrate the user data into NextAuth.js session
    // if you're not using a database adapter.

    // A more NextAuth.js-native way would involve creating a Credentials provider
    // and using `signIn` with `redirect: false` on the server-side to handle the credentials.
    // However, that makes the flow more complex with server actions.

    // For this example, let's assume successful auth and redirect to dashboard.
    // In a real app, you'd save tokenData and tiktokUser to your DB and then
    // create a JWT or session that NextAuth.js can pick up, or manually sign in.

    // For now, we'll redirect to a success page or dashboard.
    // If you were using a database with NextAuth.js:
    // You would find or create the user in your database, then store their TikTok tokens.
    // After that, NextAuth.js would automatically pick up the session.

    // For a minimal integration for testing:
    // You could store the tokens in a secure server-side session (if you have one)
    // or use a JWT that your client-side can decrypt.
    // For NextAuth.js to 'know' about this user without a database adapter,
    // you'd typically need to "manually" create a JWT that mimics NextAuth.js's JWT.
    // This is getting complicated.

    // Let's simplify for demonstration: Assume success, redirect to dashboard.
    // You will need to build the user session logic yourself from `tokenData` and `tiktokUser`.

    // Example of setting a simple cookie with access token (for demonstration ONLY, not production secure)
    // cookies().set('tiktok_access_token', accessToken, {
    //     httpOnly: true,
    //     secure: true,
    //     maxAge: expiresIn,
    //     path: '/',
    // });
    // cookies().set('tiktok_user_id', openId, {
    //     httpOnly: true,
    //     secure: true,
    //     maxAge: expiresIn,
    //     path: '/',
    // });

    // You would typically sign the user in via NextAuth.js now.
    // One way if you insist on `NextAuth.js` session:
    // You'd need a custom Credentials Provider in authOptions
    // that accepts this `openId` and `accessToken`
    // and then calls `signIn("credentials", { openId, accessToken, redirect: false })` here.
    // But then you're back to a complex NextAuth.js setup.

    // Simplest path for your "native app" idea:
    // After getting tokens, you can send them back to the client-side native app
    // or store them in a secure server-side database tied to a user.
    // For web, redirect to a dashboard.
    return NextResponse.redirect(new URL("/tiktok", NEXTAUTH_URL)); // Redirect to your dashboard or success page
  } catch (error) {
    console.error("TikTok OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/auth/error?error=OAuthFailed", NEXTAUTH_URL)
    );
  }
}

// Optional: You might also want to handle POST requests if TikTok were to send them,
// but for standard OAuth callbacks, GET is typical.
// export async function POST(req: NextRequest) {
//   return GET(req); // Or handle differently
// }
