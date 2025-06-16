"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TikTokUser {
  display_name: string;
  avatar_url?: string;
  open_id: string;
  union_id?: string;
}

export default function DashboardPage() {
  const [tiktokUser, setTiktokUser] = useState<TikTokUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    const fetchTiktokData = async () => {
      try {
        const response = await fetch("/api/tiktok/user");
        const data = await response.json();
        setTiktokUser(data);
      } catch (error) {
        console.error("Error fetching TikTok user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTiktokData();
  }, []);

  if (isLoading) {
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
          Welcome to your Dashboard!
        </h1>
        <p className="text-gray-700 mb-6">
          This is your private dashboard. You are successfully logged in via
          TikTok.
        </p>

        {tiktokUser && (
          <div className="text-left text-sm text-gray-600 mb-6">
            <h2 className="font-semibold text-lg mb-2">TikTok Profile:</h2>
            <div className="bg-gray-100 p-4 rounded-md">
              <p>
                <strong>Display Name:</strong> {tiktokUser.display_name}
              </p>
              {tiktokUser.avatar_url && (
                <img
                  src={tiktokUser.avatar_url}
                  alt="TikTok Avatar"
                  className="w-20 h-20 rounded-full mx-auto my-4"
                />
              )}
              <p>
                <strong>Open ID:</strong> {tiktokUser.open_id}
              </p>
              {tiktokUser.union_id && (
                <p>
                  <strong>Union ID:</strong> {tiktokUser.union_id}
                </p>
              )}
            </div>
            <button
              onClick={() => router.push("/tiktok/videos")}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              View Videos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
