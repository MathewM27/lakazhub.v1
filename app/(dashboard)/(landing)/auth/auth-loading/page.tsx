import { Suspense } from "react";
import AuthLoadingClient from "./auth-loading-client";

export default function AuthLoadingPage() {
  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="w-full py-6 px-8 border-b border-zinc-800">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-500">LakazHub</h1>
            {/* Role badge will be rendered in client component */}
            <Suspense fallback={null}>
              <AuthLoadingClient renderRoleBadgeOnly />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-3xl font-bold mb-6">Welcome to LakazHub</h2>
          {/* Progress bar, spinner, and messages handled in client component */}
          <Suspense fallback={null}>
            <AuthLoadingClient />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
