
export interface IChunkStrategy {
    chunk(text: string): string[]
}