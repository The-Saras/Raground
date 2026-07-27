"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 transition-all">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left Section: Logo & Nav Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-600/20 group-hover:scale-105 transition-transform">
              <span className="font-bold text-zinc-950 text-lg">R</span>
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Raground
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400">
              v1.0
            </span>
          </Link>

          {/* Navigation links - only shown if authenticated */}
          {user && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/"
                    ? "text-amber-400"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/workspaces"
                className={`text-sm font-medium transition-colors ${
                  pathname?.startsWith("/workspaces")
                    ? "text-amber-400"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Workspaces
              </Link>
            </nav>
          )}
        </div>

        {/* Right Section: User Session / Connection Status */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <nav className="flex md:hidden items-center gap-4 mr-2 border-r border-zinc-900 pr-4">
                <Link
                  href="/"
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    pathname === "/" ? "text-amber-400" : "text-zinc-400"
                  }`}
                >
                  Dash
                </Link>
                <Link
                  href="/workspaces"
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    pathname?.startsWith("/workspaces") ? "text-amber-400" : "text-zinc-400"
                  }`}
                >
                  Workspaces
                </Link>
              </nav>
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
  );
}
