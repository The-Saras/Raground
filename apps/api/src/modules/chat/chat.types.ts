import { SearchResult } from "../search/search.types";

export interface ChatResponse {
    answer: string;
    sources: SearchResult[];
}