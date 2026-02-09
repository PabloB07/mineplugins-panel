"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    await signIn("discord", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#111] border border-[#222] rounded-full px-4 py-1.5 mb-8 shadow-lg shadow-green-900/10 mx-auto block w-fit">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-gray-300 text-sm font-medium">Secure Authentication</span>
        </div>

        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-green-500/20 shadow-lg shadow-green-900/20">
            <img
              src="/mineplugins-logo.svg"
              alt="MinePlugins logo"
              className="h-16 w-16 rounded-full object-cover"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            Welcome Back to <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">MinePlugins</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-md mx-auto">
            Sign in to manage your licenses, downloads, and access your premium plugins.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#111] rounded-2xl shadow-2xl p-8 border border-[#222] hover:border-green-500/20 transition-all duration-300">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Choose your sign-in method
          </h2>

          <div className="space-y-4">
            {/* Discord Button */}
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium shadow-lg hover:shadow-[#5865F2]/25"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              {isLoading ? "Signing in..." : "Continue with Discord"}
            </button>

            {/* Additional info */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[#222]"></div>
              <span className="text-xs text-gray-500 font-medium">SECURE & FAST</span>
              <div className="flex-1 h-px bg-[#222]"></div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-[#0a0a0a] rounded-lg border border-[#222]">
            <p className="text-sm text-gray-400 text-center">
              <span className="text-green-400">✓</span> Instant access to your dashboard<br/>
              <span className="text-green-400">✓</span> Manage all your licenses in one place<br/>
              <span className="text-green-400">✓</span> Download updates instantly
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-green-400 hover:text-green-300 underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-green-400 hover:text-green-300 underline">
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-gray-500 hover:text-green-400 text-sm font-medium transition-colors inline-flex items-center gap-2"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
