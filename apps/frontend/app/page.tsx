"use client";

import React, { useState } from "react";
import { useAuth } from "./context/AuthContext";
import GoogleLoginButton from "./components/GoogleLoginButton";

export default function Home() {
  const { user, token, loading, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 font-medium animate-pulse">Establishing secure session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-600/20">
              <span className="font-bold text-zinc-950 text-lg">R</span>
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Raground
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400">
              v1.0
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs text-zinc-400">Signed in as</span>
                  <span className="text-sm font-medium text-zinc-200">{user.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-1.5 rounded-lg border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/10 text-sm font-semibold text-zinc-300 hover:text-red-400 transition-all duration-200 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <span className="text-xs flex items-center gap-1.5 font-medium text-zinc-400 border border-zinc-800 px-2.5 py-1 rounded-full bg-zinc-900/30">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Disconnected
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        {!user ? (
          /* Unauthenticated Landing / Auth Page */
          <div className="w-full max-w-4xl grid md:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Side: Brand Hero */}
            <div className="md:col-span-7 flex flex-col gap-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm w-fit">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-zinc-300 tracking-wide uppercase">AI Search & Workspace</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Securely Connect Your Workspace with{" "}
                <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  Raground Auth
                </span>
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
                An advanced enterprise-ready search integration framework. Link your Google Identity, configure data sources, and query context-aware workspace details.
              </p>
              
              {/* Features list */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">Google OAuth 2.0</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">JWT Secure Sessions</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">Express Auth API</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">Dev Sandbox Mode</span>
                </div>
              </div>
            </div>

            {/* Right Side: Auth Card */}
            <div className="md:col-span-5 w-full">
              <div className="border border-zinc-900 bg-zinc-950/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-2xl font-bold text-white">Get Started</h2>
                  <p className="text-sm text-zinc-400">Sign in to initialize your developer workspace profile.</p>
                </div>

                {/* Login Button Component */}
                <GoogleLoginButton />
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard Profile */
          <div className="w-full max-w-3xl flex flex-col gap-8 relative z-10">
            {/* Header profile banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-8 border border-zinc-900 bg-zinc-950/40 backdrop-blur-md rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center font-bold text-zinc-950 text-2xl shadow-lg shadow-amber-600/10 shrink-0">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-white">Welcome back!</h2>
                  <span className="text-zinc-400 text-sm">{user.email}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border border-green-500/20 bg-green-500/10 text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                  Active Session
                </span>
              </div>
            </div>

            {/* Profile fields and values */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 border border-zinc-900 bg-zinc-950/40 backdrop-blur-md rounded-2xl flex flex-col gap-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">User ID</span>
                <span className="text-zinc-200 font-mono text-sm break-all">{user.id}</span>
              </div>
              <div className="p-6 border border-zinc-900 bg-zinc-950/40 backdrop-blur-md rounded-2xl flex flex-col gap-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Created At</span>
                <span className="text-zinc-200 text-sm font-medium">
                  {new Date(user.createdAt).toLocaleString(undefined, {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>

            {/* Auth Token Area */}
            <div className="p-6 border border-zinc-900 bg-zinc-950/40 backdrop-blur-md rounded-2xl flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Session JWT Token</span>
                <button
                  onClick={copyToken}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Token
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <div className="bg-zinc-900/80 rounded-xl p-4 font-mono text-xs text-zinc-400 break-all border border-zinc-800/80 pr-12 line-clamp-3">
                  {token}
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                💡 <strong>Testing API endpoints?</strong> Copy this token and include it in your requests as an <code>Authorization: Bearer &lt;token&gt;</code> header to access protected backend endpoints.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <p>© 2026 Raground Search System. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="https://nextjs.org" className="hover:text-zinc-300">Next.js Framework</a>
            <span>•</span>
            <a href="https://expressjs.com" className="hover:text-zinc-300">Express API</a>
            <span>•</span>
            <a href="https://prisma.io" className="hover:text-zinc-300">Prisma Database</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
