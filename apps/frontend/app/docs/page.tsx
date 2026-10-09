"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const BASE_V1_URL = `${API_URL}/v1`;

interface WorkspaceOption {
  id: string;
  name: string;
}

export default function ApiDocsPage() {
  const { user, token } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [activeSection, setActiveSection] = useState<string>("quickstart");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Playground state
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("chat");
  const [playgroundWorkspaceId, setPlaygroundWorkspaceId] = useState<string>("");
  const [playgroundApiKey, setPlaygroundApiKey] = useState<string>("");
  const [playgroundQuery, setPlaygroundQuery] = useState<string>("What are the key points in the documents?");
  const [playgroundDocTitle, setPlaygroundDocTitle] = useState<string>("Company Policy Overview");
  const [playgroundDocContent, setPlaygroundDocContent] = useState<string>(
    "Raground is a managed RAG platform that automatically processes documents, generates vector embeddings, and provides fast semantic search and generative chat responses."
  );
  const [playgroundJobId, setPlaygroundJobId] = useState<string>("");
  const [playgroundLimit, setPlaygroundLimit] = useState<number>(3);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundResponse, setPlaygroundResponse] = useState<any>(null);
  const [playgroundStatus, setPlaygroundStatus] = useState<number | null>(null);
  const [playgroundTime, setPlaygroundTime] = useState<number | null>(null);

  // Language snippet tabs state per endpoint
  const [selectedLangs, setSelectedLangs] = useState<{ [key: string]: "curl" | "js" | "python" }>({
    chat: "curl",
    search: "curl",
    ingest: "curl",
    listDocs: "curl",
    jobStatus: "curl",
    workspaces: "curl",
  });

  // Fetch workspaces for the playground if user is logged in
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/workspaces`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const list = data.map((w: any) => ({ id: w.id, name: w.name }));
          setWorkspaces(list);
          if (!playgroundWorkspaceId) {
            setPlaygroundWorkspaceId(list[0].id);
          }
        }
      })
      .catch((err) => console.error("Docs workspaces fetch error:", err));
  }, [token]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const handleSetLang = (endpointKey: string, lang: "curl" | "js" | "python") => {
    setSelectedLangs((prev) => ({ ...prev, [endpointKey]: lang }));
  };

  // Run Playground API call
  const handleRunPlayground = async () => {
    const wsId = playgroundWorkspaceId || "YOUR_WORKSPACE_ID";
    const apiKey = playgroundApiKey.trim() || (token ? `Bearer ${token}` : "YOUR_API_KEY");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey.startsWith("Bearer ") || apiKey.startsWith("eyJ")) {
      headers["Authorization"] = apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`;
    } else {
      headers["x-api-key"] = apiKey;
    }

    setPlaygroundLoading(true);
    setPlaygroundResponse(null);
    setPlaygroundStatus(null);
    const startTime = performance.now();

    try {
      let url = "";
      let method = "GET";
      let body: any = null;

      if (selectedEndpoint === "chat") {
        url = `${BASE_V1_URL}/workspaces/${wsId}/chat`;
        method = "POST";
        body = JSON.stringify({ query: playgroundQuery, topK: playgroundLimit });
      } else if (selectedEndpoint === "search") {
        url = `${BASE_V1_URL}/workspaces/${wsId}/search`;
        method = "POST";
        body = JSON.stringify({ query: playgroundQuery, limit: playgroundLimit });
      } else if (selectedEndpoint === "ingest") {
        url = `${BASE_V1_URL}/workspaces/${wsId}/documents`;
        method = "POST";
        body = JSON.stringify({
          title: playgroundDocTitle || undefined,
          content: playgroundDocContent,
        });
      } else if (selectedEndpoint === "listDocs") {
        url = `${BASE_V1_URL}/workspaces/${wsId}/documents`;
        method = "GET";
      } else if (selectedEndpoint === "jobStatus") {
        url = `${BASE_V1_URL}/workspaces/${wsId}/jobs/${playgroundJobId || "job_id"}`;
        method = "GET";
      } else if (selectedEndpoint === "workspaces") {
        url = `${BASE_V1_URL}/workspaces`;
        method = "GET";
      }

      const res = await fetch(url, {
        method,
        headers,
        body: method !== "GET" ? body : undefined,
      });

      const endTime = performance.now();
      setPlaygroundTime(Math.round(endTime - startTime));
      setPlaygroundStatus(res.status);

      const data = await res.json().catch(() => ({ message: "Non-JSON response" }));
      setPlaygroundResponse(data);

      if (selectedEndpoint === "ingest" && data?.job?.id) {
        setPlaygroundJobId(data.job.id);
      }
    } catch (err: any) {
      const endTime = performance.now();
      setPlaygroundTime(Math.round(endTime - startTime));
      setPlaygroundStatus(0);
      setPlaygroundResponse({ error: err.message || "Network request failed" });
    } finally {
      setPlaygroundLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 relative overflow-hidden flex flex-col gap-8">
        {/* Decorative glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                <Link href="/" className="hover:text-zinc-300 transition-colors">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-zinc-400 font-medium">Developer Documentation</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <span>Raground REST API Reference</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400">
                  v1.0 (Live)
                </span>
              </h1>
              <p className="text-sm text-zinc-400 mt-1 max-w-3xl leading-relaxed">
                Complete guide and interactive playground to ingest knowledge, trigger background embeddings, perform pgvector semantic search, and generate RAG responses with Groq Llama 3.1.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/api-keys"
                className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-zinc-950 hover:from-amber-500 hover:to-yellow-400 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-600/10 flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Manage API Keys
              </Link>
            </div>
          </div>

          {/* Documentation Two-Column Layout */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Sticky Table of Contents */}
            <div className="lg:col-span-3 sticky top-24 flex flex-col gap-2 p-4 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-3 mb-1">
                Getting Started
              </span>
              <button
                onClick={() => setActiveSection("quickstart")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === "quickstart"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                🚀 Quickstart Guide
              </button>
              <button
                onClick={() => setActiveSection("auth")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === "auth"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                🔐 Authentication & Headers
              </button>

              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-3 mt-4 mb-1">
                API Endpoints
              </span>
              <button
                onClick={() => setActiveSection("chat")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                  activeSection === "chat"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                <span>RAG Chat Q&A</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">POST</span>
              </button>
              <button
                onClick={() => setActiveSection("search")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                  activeSection === "search"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                <span>Vector Search</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">POST</span>
              </button>
              <button
                onClick={() => setActiveSection("ingest")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                  activeSection === "ingest"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                <span>Ingest Document</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 font-mono font-bold">POST</span>
              </button>
              <button
                onClick={() => setActiveSection("listDocs")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                  activeSection === "listDocs"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                <span>List Documents</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono font-bold">GET</span>
              </button>
              <button
                onClick={() => setActiveSection("jobStatus")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                  activeSection === "jobStatus"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                <span>Poll Job Status</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono font-bold">GET</span>
              </button>
              <button
                onClick={() => setActiveSection("workspaces")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                  activeSection === "workspaces"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                <span>Workspaces</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono font-bold">GET</span>
              </button>

              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-3 mt-4 mb-1">
                Interactive Tool
              </span>
              <button
                onClick={() => setActiveSection("playground")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeSection === "playground"
                    ? "bg-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/20"
                    : "text-amber-400 hover:bg-amber-500/10"
                }`}
              >
                <span>⚡ Live API Playground</span>
              </button>
            </div>

            {/* Right Column: Detailed Documentation Content */}
            <div className="lg:col-span-9 flex flex-col gap-10">
              {/* SECTION: QUICKSTART */}
              {(activeSection === "quickstart" || activeSection === "all") && (
                <section id="quickstart" className="border border-zinc-900 bg-zinc-950/40 p-8 rounded-2xl flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚀</span>
                    <h2 className="text-2xl font-bold text-white">Quickstart Guide</h2>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Raground provides a turn-key Retrieval-Augmented Generation (RAG) pipeline. Get up and running in 4 easy steps:
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 flex flex-col gap-2">
                      <div className="flex items-center gap-2 font-bold text-amber-400">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">1</span>
                        <span>Create a Workspace</span>
                      </div>
                      <p className="text-zinc-400">
                        Create a workspace in the dashboard to represent your project knowledge base. Grab your <code className="text-zinc-200">workspaceId</code>.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 flex flex-col gap-2">
                      <div className="flex items-center gap-2 font-bold text-amber-400">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">2</span>
                        <span>Generate an API Key</span>
                      </div>
                      <p className="text-zinc-400">
                        Navigate to <Link href="/api-keys" className="text-amber-400 underline">API Keys</Link> and generate a secret key (<code className="text-zinc-200">rg_live_...</code>).
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 flex flex-col gap-2">
                      <div className="flex items-center gap-2 font-bold text-amber-400">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">3</span>
                        <span>Ingest Documents</span>
                      </div>
                      <p className="text-zinc-400">
                        POST plaintext or markdown documents to <code className="text-zinc-200">/v1/workspaces/:id/documents</code>. BullMQ automatically chunks and embeds into pgvector.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 flex flex-col gap-2">
                      <div className="flex items-center gap-2 font-bold text-amber-400">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">4</span>
                        <span>Query Search & RAG Chat</span>
                      </div>
                      <p className="text-zinc-400">
                        Call <code className="text-zinc-200">/v1/workspaces/:id/chat</code> for LLM synthesized answers with full source citations!
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* SECTION: AUTHENTICATION */}
              {(activeSection === "auth" || activeSection === "all") && (
                <section id="auth" className="border border-zinc-900 bg-zinc-950/40 p-8 rounded-2xl flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔐</span>
                    <h2 className="text-2xl font-bold text-white">Authentication & Headers</h2>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    All requests to the <code className="text-amber-400 font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-900">/api/v1</code> endpoints must be authenticated. You can supply your API key in either of the two standard headers:
                  </p>

                  <div className="flex flex-col gap-3">
                    <div className="p-4 border border-zinc-900 bg-zinc-900/50 rounded-xl flex flex-col gap-2 font-mono text-xs">
                      <div className="text-zinc-400 font-semibold text-[11px] uppercase tracking-wider font-sans">Option 1: Custom Header (Recommended)</div>
                      <div className="text-amber-400">x-api-key: rg_live_a1b2c3d4e5f6...</div>
                    </div>
                    <div className="p-4 border border-zinc-900 bg-zinc-900/50 rounded-xl flex flex-col gap-2 font-mono text-xs">
                      <div className="text-zinc-400 font-semibold text-[11px] uppercase tracking-wider font-sans">Option 2: Bearer Authorization</div>
                      <div className="text-amber-400">Authorization: Bearer rg_live_a1b2c3d4e5f6...</div>
                    </div>
                  </div>

                  <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl text-xs text-zinc-400 flex items-start gap-3">
                    <span className="text-amber-400 text-lg">💡</span>
                    <span>
                      <strong className="text-zinc-200">Base URL:</strong> The primary base URL for local development is{" "}
                      <code className="px-1.5 py-0.5 rounded bg-zinc-900 text-amber-300 font-mono text-[11px]">{BASE_V1_URL}</code>.
                    </span>
                  </div>
                </section>
              )}

              {/* SECTION: RAG CHAT */}
              {(activeSection === "chat" || activeSection === "all") && (
                <section id="chat" className="border border-zinc-900 bg-zinc-950/40 p-8 rounded-2xl flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                        POST
                      </span>
                      <h2 className="text-xl font-bold text-white font-mono">/v1/workspaces/:workspaceId/chat</h2>
                    </div>
                    <span className="text-xs text-zinc-500 font-medium">Generative Q&A</span>
                  </div>

                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Performs semantic retrieval across all indexed documents in the workspace and feeds the most relevant context to Groq Llama 3.1 8B to generate an accurate, hallucination-free answer with source citations.
                  </p>

                  {/* Request Body Table */}
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Request Body (JSON)</h4>
                    <div className="border border-zinc-900 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-zinc-900/50 text-zinc-400 font-semibold border-b border-zinc-900">
                          <tr>
                            <th className="p-3">Field</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Required</th>
                            <th className="p-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                          <tr>
                            <td className="p-3 font-mono text-amber-400">query</td>
                            <td className="p-3 font-mono text-zinc-400">string</td>
                            <td className="p-3 text-red-400 font-semibold">Yes</td>
                            <td className="p-3">The user prompt or question to answer from documents.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono text-amber-400">systemPrompt</td>
                            <td className="p-3 font-mono text-zinc-400">string</td>
                            <td className="p-3 text-zinc-500">Optional</td>
                            <td className="p-3">Custom persona or instructions for the AI synthesizer.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono text-amber-400">topK</td>
                            <td className="p-3 font-mono text-zinc-400">number</td>
                            <td className="p-3 text-zinc-500">Optional (5)</td>
                            <td className="p-3">Number of top semantic chunks to retrieve as context (1-20).</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Multi-language Code Snippets */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {(["curl", "js", "python"] as const).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => handleSetLang("chat", lang)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-all ${
                              selectedLangs.chat === lang
                                ? "bg-amber-500 text-zinc-950 font-bold"
                                : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/50"
                            }`}
                          >
                            {lang === "js" ? "Node.js (Fetch)" : lang === "python" ? "Python (Requests)" : "cURL"}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          const code =
                            selectedLangs.chat === "curl"
                              ? `curl -X POST "${BASE_V1_URL}/workspaces/YOUR_WORKSPACE_ID/chat" \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: rg_live_YOUR_KEY" \\\n  -d '{"query": "What is our company refund policy?", "topK": 5}'`
                              : selectedLangs.chat === "js"
                              ? `const response = await fetch("${BASE_V1_URL}/workspaces/YOUR_WORKSPACE_ID/chat", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "x-api-key": "rg_live_YOUR_KEY"\n  },\n  body: JSON.stringify({\n    query: "What is our company refund policy?",\n    topK: 5\n  })\n});\nconst data = await response.json();\nconsole.log(data.answer);`
                              : `import requests\n\nurl = "${BASE_V1_URL}/workspaces/YOUR_WORKSPACE_ID/chat"\nheaders = {\n    "Content-Type": "application/json",\n    "x-api-key": "rg_live_YOUR_KEY"\n}\npayload = {\n    "query": "What is our company refund policy?",\n    "topK": 5\n}\n\nresponse = requests.post(url, headers=headers, json=payload)\nprint(response.json())`;
                          copyToClipboard(code, "chat-code");
                        }}
                        className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedSnippet === "chat-code" ? "Copied!" : "Copy Code"}
                      </button>
                    </div>

                    <pre className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
                      {selectedLangs.chat === "curl" &&
`curl -X POST "${BASE_V1_URL}/workspaces/YOUR_WORKSPACE_ID/chat" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: rg_live_YOUR_KEY" \\
  -d '{
    "query": "What is our company refund policy?",
    "topK": 5
  }'`}
                      {selectedLangs.chat === "js" &&
`const response = await fetch("${BASE_V1_URL}/workspaces/YOUR_WORKSPACE_ID/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "rg_live_YOUR_KEY"
  },
  body: JSON.stringify({
    query: "What is our company refund policy?",
    topK: 5
  })
});

const data = await response.json();
console.log("Answer:", data.answer);
console.log("Cited Sources:", data.sources);`}
                      {selectedLangs.chat === "python" &&
`import requests

url = "${BASE_V1_URL}/workspaces/YOUR_WORKSPACE_ID/chat"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "rg_live_YOUR_KEY"
}
payload = {
    "query": "What is our company refund policy?",
    "topK": 5
}

res = requests.post(url, headers=headers, json=payload)
data = res.json()
print("Answer:", data.get("answer"))`}
                    </pre>
                  </div>

                  {/* Response Sample */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Response 200 OK</span>
                    <pre className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-xs text-amber-300/90 overflow-x-auto">
{`{
  "workspaceId": "ws_cmk289...",
  "query": "What is our company refund policy?",
  "answer": "Customers can request a full refund within 30 days of purchase provided the items are in original packaging.",
  "sources": [
    {
      "chunkId": "chk_9381...",
      "title": "Return Policy 2026",
      "content": "Refund requests are processed within 30 days of order receipt...",
      "score": 0.8912
    }
  ]
}`}
                    </pre>
                  </div>
                </section>
              )}

              {/* SECTION: VECTOR SEARCH */}
              {(activeSection === "search" || activeSection === "all") && (
                <section id="search" className="border border-zinc-900 bg-zinc-950/40 p-8 rounded-2xl flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs font-bold">
                        POST
                      </span>
                      <h2 className="text-xl font-bold text-white font-mono">/v1/workspaces/:workspaceId/search</h2>
                    </div>
                    <span className="text-xs text-zinc-500 font-medium">Vector Similarity</span>
                  </div>

                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Performs raw vector cosine distance search against stored pgvector embeddings and returns the highest scoring text chunks with metadata.
                  </p>

                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Request Body (JSON)</h4>
                    <div className="border border-zinc-900 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-zinc-900/50 text-zinc-400 font-semibold border-b border-zinc-900">
                          <tr>
                            <th className="p-3">Field</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Required</th>
                            <th className="p-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                          <tr>
                            <td className="p-3 font-mono text-blue-400">query</td>
                            <td className="p-3 font-mono text-zinc-400">string</td>
                            <td className="p-3 text-red-400 font-semibold">Yes</td>
                            <td className="p-3">Search term to vectorize and compare against chunks.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono text-blue-400">limit</td>
                            <td className="p-3 font-mono text-zinc-400">number</td>
                            <td className="p-3 text-zinc-500">Optional (5)</td>
                            <td className="p-3">Max results to return (1-50).</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <pre className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
{`curl -X POST "${BASE_V1_URL}/workspaces/YOUR_WORKSPACE_ID/search" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: rg_live_YOUR_KEY" \\
  -d '{
    "query": "deployment security instructions",
    "limit": 3
  }'`}
                  </pre>
                </section>
              )}

              {/* SECTION: INGEST DOCUMENTS */}
              {(activeSection === "ingest" || activeSection === "all") && (
                <section id="ingest" className="border border-zinc-900 bg-zinc-950/40 p-8 rounded-2xl flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 font-mono text-xs font-bold">
                        POST
                      </span>
                      <h2 className="text-xl font-bold text-white font-mono">/v1/workspaces/:workspaceId/documents</h2>
                    </div>
                    <span className="text-xs text-zinc-500 font-medium">Asynchronous Ingestion</span>
                  </div>

                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Uploads a PDF (<code className="text-amber-400 font-mono text-xs">.pdf</code>) or Plaintext/Markdown (<code className="text-amber-400 font-mono text-xs">.txt, .md</code>) document to the workspace. You can send files via <code className="text-zinc-200 font-mono text-xs">multipart/form-data</code> (using the <code className="text-amber-400 font-mono text-xs">file</code> field) or raw text via <code className="text-zinc-200 font-mono text-xs">application/json</code>. Returns a <code className="text-amber-400 font-mono text-xs">202 Accepted</code> with a background <code className="text-zinc-200 font-mono text-xs">jobId</code> while BullMQ chunks the content and indexes vector embeddings.
                  </p>

                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Payload Options</h4>
                    <div className="border border-zinc-900 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-zinc-900/50 text-zinc-400 font-semibold border-b border-zinc-900">
                          <tr>
                            <th className="p-3">Field</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Format</th>
                            <th className="p-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                          <tr>
                            <td className="p-3 font-mono text-green-400">file</td>
                            <td className="p-3 font-mono text-zinc-400">Binary File</td>
                            <td className="p-3 text-zinc-400">multipart/form-data</td>
                            <td className="p-3">Upload a <strong className="text-white">.pdf</strong>, <strong className="text-white">.txt</strong>, or <strong className="text-white">.md</strong> file (up to 25MB). Text is extracted automatically.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono text-green-400">content</td>
                            <td className="p-3 font-mono text-zinc-400">string</td>
                            <td className="p-3 text-zinc-400">application/json</td>
                            <td className="p-3">Raw document plaintext body if not uploading a file.</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono text-green-400">title</td>
                            <td className="p-3 font-mono text-zinc-400">string</td>
                            <td className="p-3 text-zinc-500">Optional</td>
                            <td className="p-3">Document title (defaults to uploaded filename if omitted).</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Example 1: Upload a PDF / Text File (cURL)</span>
                    <pre className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
{`curl -X POST "${BASE_V1_URL}/workspaces/YOUR_WORKSPACE_ID/documents" \\
  -H "x-api-key: rg_live_YOUR_KEY" \\
  -F "file=@/path/to/contract.pdf" \\
  -F "title=Q4 Master Services Agreement"`}
                    </pre>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Example 2: Upload Raw JSON Text (cURL)</span>
                    <pre className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
{`curl -X POST "${BASE_V1_URL}/workspaces/YOUR_WORKSPACE_ID/documents" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: rg_live_YOUR_KEY" \\
  -d '{
    "title": "Onboarding Guide 2026",
    "content": "All engineering employees must configure multi-factor authentication before committing code..."
  }'`}
                    </pre>
                  </div>
                </section>
              )}

              {/* SECTION: POLL JOB STATUS */}
              {(activeSection === "jobStatus" || activeSection === "all") && (
                <section id="jobStatus" className="border border-zinc-900 bg-zinc-950/40 p-8 rounded-2xl flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-mono text-xs font-bold">
                        GET
                      </span>
                      <h2 className="text-xl font-bold text-white font-mono">/v1/workspaces/:workspaceId/jobs/:jobId</h2>
                    </div>
                    <span className="text-xs text-zinc-500 font-medium">Job Polling</span>
                  </div>

                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Check the processing status of a queued document indexing job (<code className="text-amber-400 font-mono text-xs">QUEUED</code>, <code className="text-blue-400 font-mono text-xs">PROCESSING</code>, <code className="text-green-400 font-mono text-xs">COMPLETED</code>, or <code className="text-red-400 font-mono text-xs">FAILED</code>).
                  </p>

                  <pre className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
{`curl -X GET "${BASE_V1_URL}/workspaces/YOUR_WORKSPACE_ID/jobs/JOB_ID" \\
  -H "x-api-key: rg_live_YOUR_KEY"`}
                  </pre>
                </section>
              )}

              {/* SECTION: WORKSPACES */}
              {(activeSection === "workspaces" || activeSection === "all") && (
                <section id="workspaces" className="border border-zinc-900 bg-zinc-950/40 p-8 rounded-2xl flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-mono text-xs font-bold">
                        GET
                      </span>
                      <h2 className="text-xl font-bold text-white font-mono">/v1/workspaces</h2>
                    </div>
                    <span className="text-xs text-zinc-500 font-medium">Workspace Metadata</span>
                  </div>

                  <p className="text-sm text-zinc-300 leading-relaxed">
                    List all workspaces accessible to the authenticated API key or session token. If the key is scoped to a specific workspace, only that workspace is returned.
                  </p>

                  <pre className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
{`curl -X GET "${BASE_V1_URL}/workspaces" \\
  -H "x-api-key: rg_live_YOUR_KEY"`}
                  </pre>
                </section>
              )}

              {/* SECTION: INTERACTIVE LIVE API PLAYGROUND */}
              {(activeSection === "playground" || activeSection === "all") && (
                <section id="playground" className="border border-amber-500/30 bg-zinc-950 p-8 rounded-2xl flex flex-col gap-6 shadow-2xl relative">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                        ⚡
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Interactive API Playground</h3>
                        <p className="text-xs text-zinc-400">
                          Execute real live requests against your backend directly from this console.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left: Request Configuration */}
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-300">Select API Action</label>
                        <select
                          value={selectedEndpoint}
                          onChange={(e) => setSelectedEndpoint(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                        >
                          <option value="chat">POST /v1/workspaces/:id/chat (RAG Q&A)</option>
                          <option value="search">POST /v1/workspaces/:id/search (Vector Similarity)</option>
                          <option value="ingest">POST /v1/workspaces/:id/documents (Ingest Text)</option>
                          <option value="listDocs">GET /v1/workspaces/:id/documents (List Docs)</option>
                          <option value="jobStatus">GET /v1/workspaces/:id/jobs/:jobId (Check Job)</option>
                          <option value="workspaces">GET /v1/workspaces (List Workspaces)</option>
                        </select>
                      </div>

                      {/* Workspace Selector */}
                      {selectedEndpoint !== "workspaces" && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-zinc-300">Workspace</label>
                          {workspaces.length > 0 ? (
                            <select
                              value={playgroundWorkspaceId}
                              onChange={(e) => setPlaygroundWorkspaceId(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                            >
                              {workspaces.map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.name} ({w.id})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder="Enter Workspace ID (e.g. ws_123)"
                              value={playgroundWorkspaceId}
                              onChange={(e) => setPlaygroundWorkspaceId(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-900 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                          )}
                        </div>
                      )}

                      {/* API Key or Auth Header */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-300">API Key / Auth Token</label>
                        <input
                          type="password"
                          placeholder={token ? "Using active session token (or paste rg_live_...)" : "Paste rg_live_... API key"}
                          value={playgroundApiKey}
                          onChange={(e) => setPlaygroundApiKey(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-900 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono"
                        />
                      </div>

                      {/* Dynamic Fields by Endpoint */}
                      {(selectedEndpoint === "chat" || selectedEndpoint === "search") && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-zinc-300">Question / Search Query</label>
                            <input
                              type="text"
                              value={playgroundQuery}
                              onChange={(e) => setPlaygroundQuery(e.target.value)}
                              placeholder="e.g. What is the return policy?"
                              className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-900 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-zinc-300">Limit / TopK Chunks</label>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={playgroundLimit}
                              onChange={(e) => setPlaygroundLimit(parseInt(e.target.value, 10) || 5)}
                              className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                          </div>
                        </>
                      )}

                      {selectedEndpoint === "ingest" && (
                        <>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-zinc-300">Document Title</label>
                            <input
                              type="text"
                              value={playgroundDocTitle}
                              onChange={(e) => setPlaygroundDocTitle(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-zinc-300">Document Body</label>
                            <textarea
                              rows={4}
                              value={playgroundDocContent}
                              onChange={(e) => setPlaygroundDocContent(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none font-mono"
                            />
                          </div>
                        </>
                      )}

                      {selectedEndpoint === "jobStatus" && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-zinc-300">Job ID</label>
                          <input
                            type="text"
                            placeholder="Enter Job ID returned from ingestion"
                            value={playgroundJobId}
                            onChange={(e) => setPlaygroundJobId(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-900 text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          />
                        </div>
                      )}

                      <button
                        onClick={handleRunPlayground}
                        disabled={playgroundLoading}
                        className="mt-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-zinc-950 font-bold text-xs rounded-xl hover:from-amber-500 hover:to-yellow-400 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {playgroundLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                            Executing Request...
                          </>
                        ) : (
                          "Send API Request"
                        )}
                      </button>
                    </div>

                    {/* Right: Live Response Output */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-400">Response Inspector</span>
                        {playgroundStatus !== null && (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                playgroundStatus >= 200 && playgroundStatus < 300
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              Status: {playgroundStatus || "Error"}
                            </span>
                            {playgroundTime && <span className="text-[10px] text-zinc-500 font-mono">{playgroundTime}ms</span>}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-h-[300px] max-h-[420px] bg-zinc-950 border border-zinc-900 p-4 rounded-xl overflow-auto font-mono text-xs">
                        {playgroundLoading ? (
                          <div className="h-full flex items-center justify-center text-zinc-500 gap-2">
                            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Awaiting server response...</span>
                          </div>
                        ) : playgroundResponse ? (
                          <pre className="text-zinc-300 leading-relaxed">
                            {JSON.stringify(playgroundResponse, null, 2)}
                          </pre>
                        ) : (
                          <div className="h-full flex items-center justify-center text-zinc-600 text-center">
                            Select an action and click &apos;Send API Request&apos; to view live server output.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
