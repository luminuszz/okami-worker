export type SearchType = 'ANIME' | 'MANGA';

export abstract class SearchTokensProvider {
  abstract getSearchTokens(type: SearchType): Promise<string[]>;
}
