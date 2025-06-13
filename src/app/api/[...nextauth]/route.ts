// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials"; // Import CredentialsProvider

// --- Type Augmentation for Session and JWT ---
// This extends the default NextAuth.js types to include custom properties
// like 'id' and 'accessToken' that we want to store in the session/JWT.
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string; // To store TikTok's access token if needed on the client
  }

  interface JWT {
    id?: string; // To store TikTok's open_id
    accessToken?: string; // To store TikTok's access token
  }
}

// NextAuth.js configuration
export const authOptions: NextAuthOptions = {
  // You would list other standard providers (like GitHub, Google) here if you have them.
  // We are NOT listing TikTok here, as its initial OAuth flow is handled manually.
  providers: [
    CredentialsProvider({
      // The `id` here is what you'll pass to `signIn()` on the server side.
      id: "tiktok-custom",
      name: "TikTok Custom Login", // Display name, if you ever used a generic sign-in page

      // `credentials` are the fields we expect to receive when this provider is called.
      // We'll pass `openId`, `displayName`, `avatarUrl`, and `accessToken` from our TikTok callback.
      credentials: {
        openId: { label: "TikTok Open ID", type: "text" },
        displayName: { label: "Display Name", type: "text" },
        avatarUrl: { label: "Avatar URL", type: "text" },
        accessToken: { label: "Access Token", type: "text" }, // If you want to store this securely
      },

      // The authorize function is where you validate the credentials.
      // In our case, we've already validated with TikTok, so we just return the user.
      async authorize(credentials, req) {
        // Ensure necessary credentials are provided
        if (
          !credentials?.openId ||
          !credentials?.displayName ||
          !credentials?.accessToken
        ) {
          console.error("CredentialsProvider: Missing TikTok credentials.");
          return null;
        }

        // Return a user object that NextAuth.js will store in the JWT.
        // The `id` field is crucial here, as it's typically used to identify the user.
        return {
          id: credentials.openId,
          name: credentials.displayName,
          image: credentials.avatarUrl,
          accessToken: credentials.accessToken, // Store accessToken here if you need it in JWT
        };
      },
    }),
  ],

  // --- Session Strategy and Secret ---
  secret: process.env.NEXTAUTH_SECRET, // Make sure this is set in .env
  session: {
    strategy: "jwt", // Use JWT strategy for sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days session
  },

  // --- Callbacks for JWT and Session ---
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // 'user' will be populated when the CredentialsProvider returns a user
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.image = user.image;
        token.accessToken = (user as any).accessToken; // Cast to any to access custom prop
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
      session.accessToken = token.accessToken as string | undefined; // Pass access token to the session object for client-side use
      return session;
    },
  },

  // --- Custom Pages ---
  pages: {
    signIn: "/sign-in", // Path to your custom sign-in page
    error: "/auth/error", // Path to your error page
  },
};

// Create the NextAuth.js handler
const handler = NextAuth(authOptions);

// Export the GET and POST methods for Next.js Route Handlers
export { handler as GET, handler as POST };
