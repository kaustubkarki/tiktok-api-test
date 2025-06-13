"use client";

import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-blue-200 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full text-center">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-4">
          Welcome to your Dashboard,{" "}
          {session?.user?.name || session?.user?.email}!
        </h1>
        <p className="text-gray-700 mb-6">
          This is your private dashboard. You are successfully logged in via
          TikTok.
        </p>
        <div className="text-left text-sm text-gray-600">
          <h2 className="font-semibold text-lg mb-2">Session Details:</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto whitespace-pre-wrap break-all">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
        <p className="mt-6 text-gray-500">
          
          (Note: For a fully integrated NextAuth.js session for custom OAuth,
          you'd typically use a database adapter, or a more complex custom
          provider approach.)
        </p>
      </div>
    </div>
  );
}
