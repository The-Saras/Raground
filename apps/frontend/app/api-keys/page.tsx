"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPreview: string;
  rawKey?: string;
  workspaceId: string | null;
  workspace?: {
    id: string;
    name: string;
  } | null;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface WorkspaceOption {
  id: string;
  name: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ApiKeysPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [expiresInDays, setExpiresInDays] = useState<string>("0");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Success Modal State (Shows full key once)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{
    name: string;
    rawKey: string;
    keyPreview: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Revoke state
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch API keys and workspaces
  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [keysRes, wsRes] = await Promise.all([
        fetch(`${API_URL}/keys`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/workspaces`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!keysRes.ok) {
        const data = await keysRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load API keys");
      }

      const keysData = await keysRes.json();
      setKeys(keysData);

      if (wsRes.ok) {
        const wsData = await wsRes.json();
        setWorkspaces(
          wsData.map((w: any) => ({
            id: w.id,
            name: w.name,
          }))
        );
      }
    } catch (err: any) {
      console.error("Error fetching API keys:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && token) {
      fetchData();
    }
  }, [authLoading, token]);

  // Handle Create API Key
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || newKeyName.trim().length < 2) {
      setCreateError("Key name must be at least 2 characters long.");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch(`${API_URL}/keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newKeyName.trim(),
          workspaceId: selectedWorkspaceId ? selectedWorkspaceId : undefined,
          expiresInDays:
            expiresInDays !== "0" ? parseInt(expiresInDays, 10) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create API key");
      }

      // Add to list
      setKeys((prev) => [data.apiKey, ...prev]);
      setIsCreateModalOpen(false);
      setNewKeyName("");
      setSelectedWorkspaceId("");
      setExpiresInDays("0");

      // Show secret key modal
      setNewlyCreatedKey({
        name: data.apiKey.name,
        rawKey: data.rawKey,
        keyPreview: data.apiKey.keyPreview,
      });
    } catch (err: any) {
      console.error("Create API key error:", err);
      setCreateError(err.message || "Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Delete / Revoke Key
  const handleRevokeKey = async (id: string) => {
    setRevokingId(id);
    try {
      const res = await fetch(`${API_URL}/keys/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to revoke API key");
      }

      setKeys((prev) => prev.filter((k) => k.id !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error("Revoke error:", err);
      alert(err.message || "Failed to revoke key");
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 font-medium animate-pulse">
          Loading developer console...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <div className="border border-zinc-900 bg-zinc-950/60 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center gap-6 max-w-md">
            <h2 className="text-2xl font-bold text-white">
              Authentication Required
            </h2>
            <p className="text-sm text-zinc-400">
              Sign in to generate and manage API keys for your workspaces.
            </p>
            <Link
              href="/"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-zinc-950 font-semibold text-sm rounded-xl cursor-pointer"
            >
              Back to Login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 relative overflow-hidden flex flex-col gap-8">
        {/* Decorative glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-8">
          {/* Header & Breadcrumb */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                <Link
                  href="/"
                  className="hover:text-zinc-300 transition-colors"
                >
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-zinc-400 font-medium">API Keys</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <span>Developer API Keys</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400">
                  REST Auth
                </span>
              </h1>
              <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Generate and manage secret keys to query semantic search, RAG
                chat, and ingest documents programmatically into your
                workspaces.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/docs"
                className="px-4 py-2.5 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300 font-semibold text-sm rounded-xl transition-all flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                View API Docs
              </Link>
              <button
                onClick={() => {
                  setCreateError(null);
                  setIsCreateModalOpen(true);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-zinc-950 hover:from-amber-500 hover:to-yellow-400 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2 cursor-pointer"
              >
                <svg
                  className="w-4 h-4 text-zinc-950"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create New Key
              </button>
            </div>
          </div>

          {/* Security Notice Card */}
          <div className="border border-zinc-900 bg-zinc-950/40 p-4 rounded-xl flex items-start gap-3 text-xs text-zinc-400">
            <svg
              className="w-5 h-5 text-amber-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="leading-relaxed">
              <span className="font-semibold text-zinc-200">
                Security Best Practice:
              </span>{" "}
              Keep your API keys secret. Do not expose them in client-side code
              or public repositories. Authenticate requests using the{" "}
              <code className="px-1.5 py-0.5 rounded bg-zinc-900 text-amber-300 font-mono text-[11px]">
                x-api-key: rg_live_...
              </code>{" "}
              or{" "}
              <code className="px-1.5 py-0.5 rounded bg-zinc-900 text-amber-300 font-mono text-[11px]">
                Authorization: Bearer rg_live_...
              </code>{" "}
              header.
            </div>
          </div>

          {/* Keys Table / List */}
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 border border-zinc-900 bg-zinc-950/40 rounded-xl animate-pulse"
                ></div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-2xl text-center flex flex-col items-center gap-3">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={fetchData}
                className="px-4 py-2 border border-zinc-800 bg-zinc-900 rounded-xl text-xs font-semibold hover:border-zinc-700"
              >
                Retry
              </button>
            </div>
          ) : keys.length === 0 ? (
            <div className="border border-zinc-900 bg-zinc-950/40 backdrop-blur-md rounded-2xl p-12 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  No API Keys Created Yet
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Create your first API key to connect external backend
                  services, chatbots, or CLI tools to Raground.
                </p>
              </div>
              <button
                onClick={() => {
                  setCreateError(null);
                  setIsCreateModalOpen(true);
                }}
                className="mt-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-zinc-950 font-bold text-sm rounded-xl cursor-pointer hover:from-amber-500 hover:to-yellow-400 transition-all"
              >
                Create First API Key
              </button>
            </div>
          ) : (
            <div className="border border-zinc-900 bg-zinc-950/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-900/30 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Key Name</th>
                      <th className="py-3.5 px-6">Secret Preview</th>
                      <th className="py-3.5 px-6">Workspace Scope</th>
                      <th className="py-3.5 px-6">Last Used</th>
                      <th className="py-3.5 px-6">Created</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60 text-xs">
                    {keys.map((k) => (
                      <tr
                        key={k.id}
                        className="hover:bg-zinc-900/20 transition-colors"
                      >
                        <td className="py-4 px-6 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span>{k.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono text-xs text-zinc-300 bg-zinc-900/60 px-2.5 py-1 rounded-lg border border-zinc-900">
                            {k.keyPreview}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {k.workspace ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[11px] font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                              {k.workspace.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-400 text-[11px] font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                              All Workspaces
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-zinc-400">
                          {k.lastUsedAt
                            ? new Date(k.lastUsedAt).toLocaleString(undefined, {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "Never used"}
                        </td>
                        <td className="py-4 px-6 text-zinc-500">
                          {new Date(k.createdAt).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {deleteConfirmId === k.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleRevokeKey(k.id)}
                                disabled={revokingId === k.id}
                                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                              >
                                {revokingId === k.id
                                  ? "Revoking..."
                                  : "Confirm Revoke"}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2.5 py-1 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 rounded-lg text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(k.id)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Revoke key"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Key Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="border border-zinc-800 bg-zinc-950 p-6 md:p-8 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col gap-6 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Create New API Key
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Generate a secret key for programmatic API access.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {createError && (
              <div className="p-3 border border-red-500/20 bg-red-500/5 text-xs text-red-400 rounded-xl">
                ⚠️ {createError}
              </div>
            )}

            <form onSubmit={handleCreateKey} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Key Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Server, Python Ingestion Agent"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-900 rounded-xl bg-zinc-900/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Workspace Scope
                </label>
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-900 rounded-xl bg-zinc-900/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                >
                  <option value="">All Workspaces (Unrestricted access)</option>
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      Only: {w.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-zinc-500">
                  Optionally restrict this key to a single workspace for
                  heightened isolation.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Expiration
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-900 rounded-xl bg-zinc-900/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                >
                  <option value="0">Never expires</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 rounded-xl text-xs font-semibold text-zinc-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-yellow-500 text-zinc-950 font-bold text-xs rounded-xl hover:from-amber-500 hover:to-yellow-400 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreating ? "Generating Key..." : "Create Secret Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secret Key Display Modal (Shown ONCE) */}
      {newlyCreatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
          <div className="border border-amber-500/30 bg-zinc-950 p-6 md:p-8 rounded-2xl shadow-2xl max-w-xl w-full flex flex-col gap-6 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Save Your Secret API Key
                </h3>
                <p className="text-xs text-zinc-400">
                  Key name:{" "}
                  <span className="text-zinc-200 font-semibold">
                    {newlyCreatedKey.name}
                  </span>
                </p>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="p-4 border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 rounded-xl flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <span className="font-bold">Important:</span> Copy this secret
                key now. For security purposes,{" "}
                <strong className="text-white">
                  you will not be able to view it again
                </strong>{" "}
                after closing this window.
              </div>
            </div>

            {/* Monospace Key Container */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Secret Key:</span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {newlyCreatedKey.keyPreview}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                <input
                  readOnly
                  value={newlyCreatedKey.rawKey}
                  className="bg-transparent font-mono text-xs text-amber-400 w-full focus:outline-none select-all"
                />
                <button
                  onClick={() => copyToClipboard(newlyCreatedKey.rawKey)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  {copiedKey ? (
                    <>
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                        />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Test snippet */}
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="text-zinc-500">Quick Test via cURL:</span>
              <pre className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                {`curl -X GET ${API_URL}/v1/workspaces \\\n  -H "x-api-key: ${newlyCreatedKey.rawKey}"`}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-zinc-950 font-bold text-xs rounded-xl hover:from-amber-500 hover:to-yellow-400 transition-all cursor-pointer"
              >
                I have securely saved this key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
