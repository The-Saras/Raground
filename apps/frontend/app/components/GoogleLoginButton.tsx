"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

declare global {
  interface Window {
    google?: any;
    googleInitialized?: boolean;
    googleLoginCallback?: (response: any) => void;
  }
}

export default function GoogleLoginButton() {
  const { loginWithGoogleToken, error: authError } = useAuth();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mockEmailPrefix, setMockEmailPrefix] = useState("");
  const [showMockPanel, setShowMockPanel] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(loginWithGoogleToken);

  // Keep callbackRef up to date with the latest loginWithGoogleToken reference
  useEffect(() => {
    callbackRef.current = loginWithGoogleToken;
  }, [loginWithGoogleToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      setLocalError("Failed to load Google Sign-In SDK. Make sure you are online.");
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts?.id || !buttonRef.current) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setLocalError("Google Client ID is missing in environment variables (.env.local).");
      return;
    }

    try {
      if (!window.googleInitialized) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (response.credential && window.googleLoginCallback) {
              window.googleLoginCallback(response);
            }
          },
        });
        window.googleInitialized = true;
      }

      // Update the dynamic callback to call the latest loginWithGoogleToken ref
      window.googleLoginCallback = async (response: any) => {
        try {
          setLocalError(null);
          await callbackRef.current(response.credential);
        } catch (err: any) {
          setLocalError(err.message || "Failed to log in with Google");
        }
      };

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: 320,
      });
    } catch (err: any) {
      console.error("Google script initialization failed", err);
      setLocalError("Failed to initialize Google login button.");
    }
  }, [scriptLoaded]);

  const handleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockEmailPrefix.trim()) {
      setLocalError("Please enter a username or prefix for mock login.");
      return;
    }
    const cleanPrefix = mockEmailPrefix.trim().replace(/\s+/g, "_").toLowerCase();
    const mockToken = `mock_google_token_${cleanPrefix}`;
    try {
      setLocalError(null);
      await loginWithGoogleToken(mockToken);
    } catch (err: any) {
      setLocalError(err.message || "Mock login failed.");
    }
  };

  const finalError = localError || authError;

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Real Google Button Container */}
      <div className="w-full">
        {!scriptLoaded && !finalError && (
          <div className="flex items-center justify-center p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg animate-pulse bg-zinc-50/50 dark:bg-zinc-900/30">
            <span className="text-sm text-zinc-500">Loading Google Sign-in...</span>
          </div>
        )}
        <div ref={buttonRef} className="w-full overflow-hidden rounded-lg min-h-[40px] flex justify-center" />
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
        </div>
        <span className="relative px-3 bg-white dark:bg-zinc-950 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Or
        </span>
      </div>

      {/* Sandbox Toggle */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowMockPanel(!showMockPanel)}
          className="flex items-center justify-center gap-2 w-full p-3 text-sm font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 border border-dashed border-amber-200 hover:border-amber-400 dark:border-amber-900/60 dark:hover:border-amber-500 rounded-lg bg-amber-50/20 hover:bg-amber-50/40 dark:bg-amber-950/5 dark:hover:bg-amber-950/10 transition-all duration-200 cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          {showMockPanel ? "Hide Developer Sandbox" : "Open Developer Sandbox (Mock)"}
        </button>

        {showMockPanel && (
          <form onSubmit={handleMockLogin} className="flex flex-col gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 backdrop-blur-sm transition-all">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-1">
              ✨ <strong>Mock Developer Authentication:</strong> Sign in with a mock token. Enter any name prefix (e.g. <code>bob</code> gets logged in as <code>bob@example.com</code>).
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. test_developer"
                  value={mockEmailPrefix}
                  onChange={(e) => setMockEmailPrefix(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shadow-md shadow-amber-600/10 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Error Message */}
      {finalError && (
        <div className="p-3 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-950/20 text-xs font-medium text-red-600 dark:text-red-400">
          ⚠️ {finalError}
        </div>
      )}
    </div>
  );
}
