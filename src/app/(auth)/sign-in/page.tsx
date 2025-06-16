"use client";

import { initiateTikTokLogin } from "@/app/actions/tiktok-oauth";
import { signOut, useSession } from "next-auth/react";

export default function LoginPage() {
  const { data: session, status } = useSession();

  // Show a loading state while the session is being fetched
  if (status === "loading") {
    return <div>Loading authentication status...</div>;
  }

  // If the user is already authenticated, show their name and a sign out button
  if (session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Logged in as {session.user.name || session.user.email}
          </h1>
          <button
            onClick={() => signOut({ callbackUrl: "/" })} // Redirect to home after sign out
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // If not authenticated, show the sign-in button
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
        <h1 className="text-3xl font-extrabold text-indigo-700 mb-6">
          Welcome!
        </h1>
        <p className="text-gray-600 mb-8">Sign in to continue your journey.</p>

        {/* Button to initiate TikTok OAuth flow */}
        <button
          onClick={async () => {
            try {
              // Call the server action to handle the redirect
              await initiateTikTokLogin();
            } catch (error) {
              console.error("Failed to initiate TikTok login:", error);
              // You might want to show a user-friendly error message here
              alert("Could not start TikTok login. Please try again.");
            }
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
        >
          {/* You can replace this with a TikTok icon if you have one */}
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3.328 8.016l-3.328 1.996v-5.263l3.328-1.996v5.263zm-3.328 0v-5.263l3.328-1.996l-3.328-1.996l-3.328 1.996v5.263l3.328 1.996z"></path>
          </svg>
          <span>Sign in with TikTok</span>
        </button>

        {/* Add a generic sign-in button for NextAuth if you still have other providers (e.g., GitHub) */}
        {/* <button
          onClick={() => signIn()} // This would bring up the default NextAuth sign-in page if multiple providers are configured
          className="w-full mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
        >
          Sign in with other options
        </button> */}
      </div>
    </div>
  );
}
