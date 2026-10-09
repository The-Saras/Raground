export interface SearchResult {
    chunkId: string;
    content: string;
    score: number;
    dataSourceId?: string;
    dataSourceTitle?: string | null;
}