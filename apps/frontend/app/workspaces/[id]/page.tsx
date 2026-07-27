"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";

interface DataSource {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
}

interface Job {
  id: string;
  type: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  error: string | null;
  dataSourceId: string;
  createdAt: string;
  updatedAt: string;
}

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  updatedAt: string;
  dataSources?: DataSource[];
  jobs?: Job[];
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  sources?: { title: string | null; content: string }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function WorkspaceDetailPage() {
  const { user, token, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"sources" | "chat">("sources");

  // Ingestion Form State
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Chat State
  const [chatQuery, setChatQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch details
  const fetchDetails = async (showSkeleton = false) => {
    if (!token || !id) return;
    if (showSkeleton) setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/workspaces/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Workspace not found");
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load workspace details");
      }

      const data = await res.json();
      setWorkspace(data);
      setError(null);
    } catch (err: any) {
      console.error("Fetch workspace detail error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && token && id) {
      fetchDetails(true);
    }
  }, [authLoading, token, id]);

  // Poll for job updates if any jobs are active (QUEUED or PROCESSING)
  useEffect(() => {
    if (!workspace) return;

    const hasActiveJobs = workspace.jobs?.some(
      (job) => job.status === "QUEUED" || job.status === "PROCESSING"
    );

    if (hasActiveJobs) {
      const interval = setInterval(() => {
        fetchDetails(false);
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [workspace]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatting]);

  // Handle uploading document
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docContent.trim()) {
      setUploadError("Document content cannot be empty.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const res = await fetch(`${API_URL}/workspaces/${id}/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: docTitle.trim() || undefined,
          content: docContent.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to upload document");
      }

      setUploadSuccess(true);
      setDocTitle("");
      setDocContent("");
      // Refresh details to show new datasource and triggered ingestion job
      await fetchDetails(false);

      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      console.error("Upload document error:", err);
      setUploadError(err.message || "Could not upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle chat question
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    const userMsg = chatQuery.trim();
    setChatQuery("");
    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsChatting(true);
    setChatError(null);

    try {
      const res = await fetch(`${API_URL}/chat/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: userMsg,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Chat failed");
      }

      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
          sources: data.sources,
        },
      ]);
    } catch (err: any) {
      console.error("Chat playground error:", err);
      setChatError(err.message || "RAG engine responded with an error.");
    } finally {
      setIsChatting(false);
    }
  };

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
          <div className="w-full max-w-md border border-zinc-900 bg-zinc-950/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Authentication Required</h2>
            <Link
              href="/"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-zinc-950 font-semibold text-sm rounded-xl transition-all cursor-pointer"
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

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 relative overflow-hidden flex flex-col">
        {/* Background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-6 flex-1">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/workspaces" className="hover:text-zinc-300 transition-colors">
              Workspaces
            </Link>
            <span>/</span>
            <span className="text-zinc-400 font-medium truncate max-w-[200px]">
              {workspace ? workspace.name : "..."}
            </span>
          </div>

          {/* Back Action & Title */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/workspaces"
                className="w-10 h-10 border border-zinc-900 bg-zinc-950/80 rounded-xl flex items-center justify-center hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white truncate max-w-[300px] md:max-w-md">
                    {workspace ? workspace.name : "Loading..."}
                  </h1>
                  {workspace && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/20 bg-green-500/5 text-green-400 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      {workspace.status}
                    </span>
                  )}
                </div>
                <p className="text-zinc-400 text-sm mt-0.5 line-clamp-1">
                  {workspace?.description || "No description provided."}
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchDetails(true)}
              className="p-2 border border-zinc-900 bg-zinc-950/80 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0"
              title="Refresh status"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.228 8H18.5" />
              </svg>
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>

          {isLoading ? (
            // Page skeleton load
            <div className="grid md:grid-cols-12 gap-8 items-start flex-1 mt-4">
              <div className="md:col-span-8 flex flex-col gap-6">
                <div className="h-10 bg-zinc-900 rounded-xl w-64 animate-pulse"></div>
                <div className="h-64 border border-zinc-900 bg-zinc-950/40 rounded-2xl animate-pulse"></div>
              </div>
              <div className="md:col-span-4 flex flex-col gap-6">
                <div className="h-48 border border-zinc-900 bg-zinc-950/40 rounded-2xl animate-pulse"></div>
              </div>
            </div>
          ) : error ? (
            // Detail load error
            <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-2xl text-center flex flex-col items-center gap-4 mt-6">
              <svg className="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-xl font-bold text-white">Error loading workspace details</h3>
                <p className="text-sm text-zinc-400 mt-2">{error}</p>
              </div>
              <Link
                href="/workspaces"
                className="px-5 py-2 border border-zinc-800 bg-zinc-900 hover:border-zinc-700 font-semibold rounded-xl text-sm transition-all"
              >
                Back to List
              </Link>
            </div>
          ) : (
            workspace && (
              <div className="grid md:grid-cols-12 gap-8 items-start mt-4">
                {/* Left Side: Dynamic Tabs (Sources List / Chat Playground) */}
                <div className="md:col-span-8 flex flex-col gap-6">
                  {/* Tab Navigation */}
                  <div className="flex border-b border-zinc-900 gap-6">
                    <button
                      onClick={() => setActiveTab("sources")}
                      className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === "sources"
                          ? "border-amber-500 text-amber-500"
                          : "border-transparent text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Documents & Data
                    </button>
                    <button
                      onClick={() => setActiveTab("chat")}
                      className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === "chat"
                          ? "border-amber-500 text-amber-500"
                          : "border-transparent text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      AI Playground (RAG)
                    </button>
                  </div>

                  {/* Tab Contents: Data Sources & Ingest */}
                  {activeTab === "sources" && (
                    <div className="flex flex-col gap-6">
                      {/* Document upload box */}
                      <div className="border border-zinc-900 bg-zinc-950/40 backdrop-blur-md p-6 rounded-2xl flex flex-col gap-4">
                        <div className="flex flex-col">
                          <h3 className="text-base font-bold text-white">Ingest Data Source</h3>
                          <p className="text-xs text-zinc-500">
                            Upload plaintext documents to build the workspace knowledge index.
                          </p>
                        </div>

                        {uploadError && (
                          <div className="p-3 border border-red-500/25 bg-red-500/5 text-xs text-red-400 rounded-lg">
                            ⚠️ {uploadError}
                          </div>
                        )}

                        {uploadSuccess && (
                          <div className="p-3 border border-green-500/20 bg-green-500/10 text-xs text-green-400 rounded-lg flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            Document uploaded successfully! Indexing job queued.
                          </div>
                        )}

                        <form onSubmit={handleUploadDocument} className="flex flex-col gap-4">
                          <div className="grid sm:grid-cols-3 gap-4 items-start">
                            <div className="sm:col-span-3 flex flex-col gap-1.5">
                              <input
                                type="text"
                                placeholder="Title (e.g. Employee Handbook v2026)"
                                value={docTitle}
                                onChange={(e) => setDocTitle(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-zinc-900 rounded-xl bg-zinc-950 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all"
                              />
                            </div>
                            <div className="sm:col-span-3 flex flex-col gap-1.5">
                              <textarea
                                required
                                placeholder="Paste raw plaintext document content here for embeddings..."
                                value={docContent}
                                onChange={(e) => setDocContent(e.target.value)}
                                rows={5}
                                className="w-full px-3 py-2 text-sm border border-zinc-900 rounded-xl bg-zinc-950 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all resize-none"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={isUploading}
                            className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-zinc-950 hover:from-amber-500 hover:to-yellow-400 font-bold text-sm rounded-xl transition-all duration-300 shadow-md shadow-amber-600/10 self-end flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {isUploading ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                                Ingesting...
                              </>
                            ) : (
                              "Upload & Index"
                            )}
                          </button>
                        </form>
                      </div>

                      {/* Documents List */}
                      <div className="flex flex-col gap-4">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <span>Connected Source Files</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-zinc-900 bg-zinc-950/60 text-zinc-400">
                            {workspace.dataSources?.length || 0}
                          </span>
                        </h3>

                        {!workspace.dataSources || workspace.dataSources.length === 0 ? (
                          <div className="p-8 border border-zinc-900 bg-zinc-950/20 rounded-2xl text-center text-sm text-zinc-500">
                            No documents uploaded yet. Paste text content above to add your first resource.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {workspace.dataSources.map((ds) => {
                              // Find matching job status
                              const matchedJob = workspace.jobs?.find(
                                (j) => j.dataSourceId === ds.id
                              );
                              return (
                                <div
                                  key={ds.id}
                                  className="border border-zinc-900 bg-zinc-950/40 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-3"
                                >
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <h4 className="font-bold text-white text-sm truncate">
                                          {ds.title || "Untitled Document"}
                                        </h4>
                                        <span className="text-[10px] text-zinc-500">
                                          Uploaded: {new Date(ds.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Job Status Indicator */}
                                    {matchedJob ? (
                                      <span
                                        className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${
                                          matchedJob.status === "COMPLETED"
                                            ? "border-green-500/20 bg-green-500/5 text-green-400"
                                            : matchedJob.status === "FAILED"
                                            ? "border-red-500/20 bg-red-500/5 text-red-400"
                                            : "border-yellow-500/20 bg-yellow-500/5 text-yellow-400 animate-pulse"
                                        }`}
                                      >
                                        {matchedJob.status === "COMPLETED" && (
                                          <span className="w-1 h-1 rounded-full bg-green-500"></span>
                                        )}
                                        {matchedJob.status === "FAILED" && (
                                          <span className="w-1 h-1 rounded-full bg-red-500"></span>
                                        )}
                                        {(matchedJob.status === "QUEUED" ||
                                          matchedJob.status === "PROCESSING") && (
                                          <span className="w-1 h-1 rounded-full bg-yellow-500"></span>
                                        )}
                                        {matchedJob.status === "PROCESSING"
                                          ? "Indexing..."
                                          : matchedJob.status === "QUEUED"
                                          ? "Queued"
                                          : matchedJob.status.toLowerCase()}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-zinc-600">No Job Info</span>
                                    )}
                                  </div>
                                  <p className="text-zinc-400 text-xs leading-relaxed font-mono bg-zinc-950/80 rounded-xl p-3 border border-zinc-900 pr-12 line-clamp-3 break-all">
                                    {ds.content}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab Contents: AI Playground Chat */}
                  {activeTab === "chat" && (
                    <div className="border border-zinc-900 bg-zinc-950/40 backdrop-blur-md rounded-2xl flex flex-col h-[500px]">
                      {/* Chat Top Banner */}
                      <div className="px-6 py-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/20">
                        <div className="flex flex-col">
                          <h3 className="text-sm font-bold text-white">AI Search Assistant</h3>
                          <p className="text-[11px] text-zinc-500">
                            Ask questions contextually answered strictly by your indexed data sources.
                          </p>
                        </div>
                        <button
                          onClick={() => setChatHistory([])}
                          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-semibold"
                        >
                          Clear Chat
                        </button>
                      </div>

                      {/* Chat Messages Log */}
                      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                        {chatHistory.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500 gap-3">
                            <div className="w-12 h-12 rounded-full bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <div className="max-w-xs flex flex-col gap-1">
                              <h4 className="text-sm font-bold text-zinc-300">RAG Sandbox Ready</h4>
                              <p className="text-xs text-zinc-400">
                                Send a message to query the vector embeddings of this workspace.
                              </p>
                            </div>
                          </div>
                        ) : (
                          chatHistory.map((msg, i) => (
                            <div
                              key={i}
                              className={`flex flex-col gap-1.5 max-w-[85%] ${
                                msg.role === "user" ? "self-end items-end" : "self-start items-start"
                              }`}
                            >
                              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                                {msg.role === "user" ? "You" : "Raground Agent"}
                              </span>
                              <div
                                className={`rounded-2xl p-4 text-sm leading-relaxed border ${
                                  msg.role === "user"
                                    ? "bg-amber-600/10 border-amber-500/25 text-amber-200"
                                    : "bg-zinc-900/60 border-zinc-900 text-zinc-300"
                                }`}
                              >
                                {msg.text}
                              </div>

                              {/* Sources Collapsible block */}
                              {msg.sources && msg.sources.length > 0 && (
                                <details className="mt-1 w-full text-[11px] text-zinc-500">
                                  <summary className="cursor-pointer hover:text-zinc-300 font-semibold transition-colors focus:outline-none">
                                    References used ({msg.sources.length})
                                  </summary>
                                  <div className="flex flex-col gap-2 mt-2 pl-3 border-l border-zinc-900">
                                    {msg.sources.map((src, idx) => (
                                      <div key={idx} className="flex flex-col gap-1">
                                        <span className="font-bold text-zinc-400">
                                          [{idx + 1}] {src.title || "Untitled Document"}
                                        </span>
                                        <p className="font-mono text-[10px] bg-zinc-950/50 p-2 rounded-lg border border-zinc-900 truncate">
                                          {src.content}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </div>
                          ))
                        )}

                        {isChatting && (
                          <div className="self-start flex flex-col gap-1.5 max-w-[85%]">
                            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                              Raground Agent
                            </span>
                            <div className="rounded-2xl p-4 border bg-zinc-900/60 border-zinc-900 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-150"></span>
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-300"></span>
                            </div>
                          </div>
                        )}

                        {chatError && (
                          <div className="p-3 border border-red-500/25 bg-red-500/5 text-xs text-red-400 rounded-lg">
                            ⚠️ {chatError}
                          </div>
                        )}

                        <div ref={chatEndRef} />
                      </div>

                      {/* Chat Input form */}
                      <form
                        onSubmit={handleSendChat}
                        className="p-4 border-t border-zinc-900 bg-zinc-950/20 flex gap-3"
                      >
                        <input
                          type="text"
                          required
                          placeholder="Ask a question about this workspace..."
                          value={chatQuery}
                          onChange={(e) => setChatQuery(e.target.value)}
                          className="flex-1 px-4 py-2.5 text-sm border border-zinc-900 rounded-xl bg-zinc-950 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all"
                        />
                        <button
                          type="submit"
                          disabled={isChatting || !chatQuery.trim()}
                          className="px-5 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-600/10 flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Send
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Right Side: Sidebar Meta details */}
                <div className="md:col-span-4 flex flex-col gap-6">
                  {/* Workspace Summary details */}
                  <div className="border border-zinc-900 bg-zinc-950/40 backdrop-blur-md p-6 rounded-2xl flex flex-col gap-4">
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
                      Workspace Profile
                    </h3>

                    <div className="flex flex-col gap-4 text-sm mt-1">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-zinc-500">Workspace ID</span>
                        <span className="font-mono text-xs text-zinc-300 break-all bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-900">
                          {workspace.id}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-zinc-500">Status</span>
                        <div className="flex items-center gap-1.5 font-medium text-zinc-300">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <span>Active Environment</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-zinc-500">Created At</span>
                        <span className="font-medium text-zinc-300">
                          {new Date(workspace.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-zinc-500">Last Synced</span>
                        <span className="font-medium text-zinc-300">
                          {new Date(workspace.updatedAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Indexing status & Jobs logs overview */}
                  <div className="border border-zinc-900 bg-zinc-950/40 backdrop-blur-md p-6 rounded-2xl flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
                        Indexing Jobs
                      </h3>
                      {workspace.jobs &&
                        workspace.jobs.some(
                          (j) => j.status === "QUEUED" || j.status === "PROCESSING"
                        ) && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                        )}
                    </div>

                    {!workspace.jobs || workspace.jobs.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">No indexing tasks recorded.</p>
                    ) : (
                      <div className="flex flex-col gap-3.5 max-h-[250px] overflow-y-auto pr-1">
                        {workspace.jobs.map((job) => (
                          <div
                            key={job.id}
                            className="text-xs border-b border-zinc-900/60 pb-3 last:border-0 last:pb-0"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-mono text-[10px] text-zinc-400 font-bold">
                                JOB-{job.id.substring(0, 8)}
                              </span>
                              <span
                                className={`text-[9px] font-bold uppercase ${
                                  job.status === "COMPLETED"
                                    ? "text-green-400"
                                    : job.status === "FAILED"
                                    ? "text-red-400"
                                    : "text-amber-400"
                                }`}
                              >
                                {job.status}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 text-[11px] text-zinc-500">
                              <div className="flex justify-between">
                                <span>Type:</span>
                                <span className="font-semibold text-zinc-400">{job.type}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Run:</span>
                                <span>
                                  {new Date(job.createdAt).toLocaleString(undefined, {
                                    timeStyle: "short",
                                  })}
                                </span>
                              </div>
                              {job.error && (
                                <div className="mt-1 text-red-500 text-[9px] leading-relaxed break-all bg-red-950/10 border border-red-500/10 p-1.5 rounded-lg">
                                  Reason: {job.error}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
