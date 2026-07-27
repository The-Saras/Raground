"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  updatedAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function WorkspacesPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Workspace Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Fetch workspaces
  const fetchWorkspaces = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/workspaces`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch workspaces");
      }

      const data = await res.json();
      setWorkspaces(data);
    } catch (err: any) {
      console.error("Fetch workspaces error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && token) {
      fetchWorkspaces();
    }
  }, [authLoading, token]);

  // Handle workspace creation submission
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim().length < 3) {
      setCreateError("Workspace name must be at least 3 characters long.");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch(`${API_URL}/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create workspace");
      }

      // Add to local state list and close modal
      setWorkspaces((prev) => [data, ...prev]);
      setIsModalOpen(false);
      setNewName("");
      setNewDescription("");
    } catch (err: any) {
      console.error("Create workspace error:", err);
      setCreateError(err.message || "Could not create workspace.");
    } finally {
      setIsCreating(false);
    }
  };

  // Filter workspaces based on search query
  const filteredWorkspaces = workspaces.filter((ws) => {
    const nameMatch = ws.name.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = ws.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    return nameMatch || descMatch;
  });

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 font-medium animate-pulse">Establishing secure session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="w-full max-w-md border border-zinc-900 bg-zinc-950/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-white">Authentication Required</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Please return to the dashboard and sign in using your Google account to manage your developer workspaces.
              </p>
            </div>
            <Link
              href="/"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-zinc-950 font-semibold text-sm rounded-xl transition-all duration-300 shadow-md shadow-amber-600/10 hover:shadow-amber-500/30 cursor-pointer"
            >
              Go to Login Page
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 relative overflow-hidden flex flex-col">
        {/* Background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-8 flex-1">
          {/* Header section with Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Workspaces</h1>
              <p className="text-sm text-zinc-400">
                Create and manage your private indexing profiles and connected data stores.
              </p>
            </div>
            <button
              onClick={() => {
                setCreateError(null);
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-zinc-950 font-bold text-sm rounded-xl transition-all duration-300 shadow-lg shadow-amber-600/15 hover:shadow-amber-500/30 flex items-center justify-center gap-2 group shrink-0 cursor-pointer"
            >
              <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              New Workspace
            </button>
          </div>

          {/* Search bar & Stats */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center p-4 border border-zinc-900 bg-zinc-950/40 backdrop-blur-md rounded-2xl">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search workspaces by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-zinc-900 rounded-xl bg-zinc-950 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border border-zinc-900 bg-zinc-950/60 text-zinc-400 self-start sm:self-auto shrink-0">
              Total Count: <span className="text-amber-400 font-bold">{filteredWorkspaces.length}</span>
            </div>
          </div>

          {/* Directory Listings */}
          {isLoading ? (
            // Skeleton Loader cards
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="border border-zinc-900 bg-zinc-950/40 backdrop-blur-md rounded-2xl p-6 flex flex-col gap-4 animate-pulse h-48"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900"></div>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="h-4 bg-zinc-900 rounded w-2/3"></div>
                      <div className="h-3 bg-zinc-900 rounded w-1/4"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-zinc-900 rounded w-full mt-2"></div>
                  <div className="h-3 bg-zinc-900 rounded w-4/5"></div>
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-zinc-900/50">
                    <div className="h-3 bg-zinc-900 rounded w-1/3"></div>
                    <div className="h-3 bg-zinc-900 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error Banner
            <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl text-center flex flex-col items-center gap-4">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-white">Failed to Load Workspaces</h3>
                <p className="text-sm text-zinc-400 mt-1">{error}</p>
              </div>
              <button
                onClick={fetchWorkspaces}
                className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-sm font-semibold rounded-xl transition-all cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            // Empty State
            <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-zinc-900 bg-zinc-950/20 rounded-2xl text-center min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/25 mb-4 shadow-lg shadow-amber-500/5">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">No Workspaces Found</h3>
              <p className="text-sm text-zinc-400 mt-2 max-w-sm leading-relaxed">
                {searchQuery
                  ? "We couldn't find any workspaces matching your search term. Try adjusting your query."
                  : "Workspaces allow you to compartmentalize data ingest pipelines and chat contexts. Create your first workspace to start."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-6 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-zinc-950 font-semibold text-sm rounded-xl hover:shadow-md hover:shadow-amber-500/10 transition-all cursor-pointer"
                >
                  Create Workspace
                </button>
              )}
            </div>
          ) : (
            // Cards Grid
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="border border-zinc-900 bg-zinc-950/40 backdrop-blur-md hover:border-amber-500/30 hover:bg-zinc-900/20 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group h-48 relative overflow-hidden"
                >
                  {/* Card glow on hover */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors duration-300 pointer-events-none"></div>

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600/10 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-500 text-lg group-hover:scale-105 transition-transform shrink-0">
                          {ws.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors text-base truncate pr-2">
                            {ws.name}
                          </h3>
                          <span className="text-[10px] text-zinc-500 font-mono tracking-tight truncate">
                            ID: {ws.id}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/20 bg-green-500/5 text-green-400 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Active
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 min-h-[32px]">
                      {ws.description || (
                        <span className="italic text-zinc-600">No description provided</span>
                      )}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-zinc-900/50">
                    <span className="text-[10px] text-zinc-500">
                      Created: {new Date(ws.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </span>
                    <Link
                      href={`/workspaces/${ws.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-400 group/link transition-colors cursor-pointer"
                    >
                      Open
                      <svg className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md border border-zinc-900 bg-zinc-950 p-6 rounded-2xl shadow-2xl flex flex-col gap-6 relative animate-scale-up">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Create Workspace</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg border border-zinc-900 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {createError && (
              <div className="p-3 border border-red-500/25 bg-red-500/5 text-xs text-red-400 rounded-lg">
                ⚠️ {createError}
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Workspace Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Finance Analyzer"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-900 rounded-xl bg-zinc-950 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all"
                />
                <span className="text-[10px] text-zinc-500">
                  Minimum 3 characters. Must be unique and descriptive.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  placeholder="Explain what documents or sources are cataloged here..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-zinc-900 rounded-xl bg-zinc-950 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-900 hover:border-zinc-800 text-sm font-semibold rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-yellow-500 text-zinc-950 hover:from-amber-500 hover:to-yellow-400 font-bold text-sm rounded-xl transition-all duration-300 shadow-md shadow-amber-600/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Workspace"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
