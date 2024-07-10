import {
  SearchTokensProvider,
  SearchType,
} from '@app/domain/work/contracts/search-tokens.provider';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export type OkamiSearchToken = {
  token: string;
  type: SearchType;
};

@Injectable()
export class OkamiSearchTokensProvider
  implements SearchTokensProvider, OnModuleInit
{
  constructor(private readonly httpService: HttpService) {}

  private storage: Record<SearchType, string[]> = {
    ANIME: [],
    MANGA: [],
  };

  async getSearchTokens(type: SearchType): Promise<string[]> {
    if (this.storage[type].length > 0) {
      return this.storage[type];
    }

    const results = await this.httpService.axiosRef.get<OkamiSearchToken[]>(
      `/search-token`,
      {
        params: {
          type,
        },
      },
    );

    this.storage[type] = results.data.map((result) => result.token);

    return results.data.map((result) => result.token);
  }

  async onModuleInit() {
    this.storage.ANIME = await this.getSearchTokens('ANIME');
    this.storage.MANGA = await this.getSearchTokens('MANGA');
  }
}
