import { SearchResult } from "../modules/search/search.types";
export interface ISearchService {
    search(workspaceId: string, query: string): Promise<SearchResult[]>;
}