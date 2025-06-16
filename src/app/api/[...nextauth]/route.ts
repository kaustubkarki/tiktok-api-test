// src/app/api/auth/[...nextauth]/route.ts
// NextAuth route handler for /api/auth/[...nextauth] – includes a custom TikTok Credentials provider
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials"; // We'll build a manual TikTok auth flow with this CredentialsProvider

// --- Type Augmentation for Session and JWT ---
// The following declarations extend the built-in NextAuth types so that we can persist
// TikTok's open_id and accessToken inside the session and JWT objects.
declare module "next-auth" {
  interface User {
    accessToken?: string;
  }
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string; // TikTok OAuth2 access token – exposed to the client when React needs to call TikTok APIs
  }

  interface JWT {
    id?: string; // TikTok user identifier (open_id)
    accessToken?: string; // TikTok OAuth2 access token
  }
}

// NextAuth.js configuration
export const authOptions: NextAuthOptions = {
  // Add your usual OAuth providers (GitHub, Google, etc.) here if you need them. They are omitted for brevity.
  // Do NOT register the built-in TikTok provider – we already executed the OAuth flow manually and will hand the resulting tokens to NextAuth via CredentialsProvider below.
  providers: [
    CredentialsProvider({
      // The `id` here is what you'll pass to `signIn()` on the server side.
      id: "tiktok-custom",
      name: "TikTok Custom Login", // Display label when using the default sign-in page (not typically shown in our flow)

      // `credentials` are the fields we expect to receive when this provider is called.
      // These fields are posted from the /auth/tiktok/callback route once the TikTok OAuth flow finishes.
      credentials: {
        openId: { label: "TikTok Open ID", type: "text" },
        displayName: { label: "Display Name", type: "text" },
        avatarUrl: { label: "Avatar URL", type: "text" },
        accessToken: { label: "Access Token", type: "text" }, // Token coming from TikTok – we will persist it inside the JWT
      },

      // The authorize callback runs on the server and lets us turn the posted credentials into a valid user object.
      // Because the OAuth handshake already happened on TikTok, we simply sanity-check the payload and return it.
      async authorize(credentials) {
        // Extra guard: make sure the TikTok callback gave us all the required fields
        if (
          !credentials?.openId ||
          !credentials?.displayName ||
          !credentials?.accessToken
        ) {
          console.error("CredentialsProvider: Missing TikTok credentials.");
          return null;
        }

        // NextAuth will merge whatever we return here into the JWT. The id (open_id) is essential for user identification.
        return {
          id: credentials.openId,
          name: credentials.displayName,
          image: credentials.avatarUrl,
          accessToken: credentials.accessToken, // Persist access token so that we can attach it to API requests later
        };
      },
    }),
  ],

  // --- Session Strategy and Secret ---
  secret: process.env.NEXTAUTH_SECRET, // Required for signing/encrypting the JWT – define NEXTAUTH_SECRET in .env
  session: {
    strategy: "jwt", // Persist sessions as stateless JWTs (no database)
    maxAge: 30 * 24 * 60 * 60, // Re-authenticate after 30 days
  },

  // --- Callbacks for JWT and Session ---
  callbacks: {
    async jwt({ token, user }) {
      // 'user' will be populated when the CredentialsProvider returns a user
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.image = user.image;
        token.accessToken = user.accessToken; // Stash TikTok token inside JWT
      }
      // 'account' and 'profile' would be for standard OAuth providers (like GitHub)
      // For our custom TikTok flow, we handle the initial token/profile in the callback route.
      return token;
    },
    async session({ session, token }) {
      // Populate session.user from the token
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.image = token.image as string | null | undefined;
      }
      session.accessToken = token.accessToken as string | undefined; // Surface the token to the browser when you need to call TikTok APIs client-side
      return session;
    },
  },

  // --- Custom Pages ---
  pages: {
    signIn: "/sign-in", // Friendly custom sign-in route
    error: "/auth/error", // Redirect here when NextAuth encounters an error
  },
};

// Create the NextAuth.js handler
const handler = NextAuth(authOptions);

// Export the GET and POST methods for Next.js Route Handlers
export { handler as GET, handler as POST };
