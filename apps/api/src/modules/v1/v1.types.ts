export interface IngestDocumentRequest {
    title?: string;
    content: string;
}

export interface IngestDocumentResponse {
    success: boolean;
    message: string;
    document: {
        id: string;
        title: string | null;
        workspaceId: string;
        createdAt: Date;
    };
    job: {
        id: string;
        status: string;
        type: string;
    };
}

export interface DocumentSummary {
    id: string;
    title: string | null;
    contentLength: number;
    chunkCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface JobStatusResponse {
    id: string;
    status: string;
    type: string;
    error: string | null;
    workspaceId: string;
    dataSourceId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SearchQueryRequest {
    query: string;
    limit?: number;
}

export interface SearchQueryResponse {
    workspaceId: string;
    query: string;
    count: number;
    results: {
        chunkId: string;
        content: string;
        score: number;
        dataSourceId?: string;
        dataSourceTitle?: string | null;
    }[];
}

export interface ChatQueryRequest {
    query: string;
    systemPrompt?: string;
    topK?: number;
}

export interface ChatQueryResponse {
    workspaceId: string;
    query: string;
    answer: string;
    sources: {
        chunkId: string;
        content: string;
        score: number;
        dataSourceId?: string;
        dataSourceTitle?: string | null;
    }[];
}
