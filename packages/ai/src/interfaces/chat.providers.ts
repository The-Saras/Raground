export interface IChatProvider {
    generateResponse(prompt: string): Promise<string>;
}