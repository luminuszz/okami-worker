import { Injectable, Logger } from '@nestjs/common';
import { find, some } from 'lodash';
import { NotificationProvider } from '../contracts/notification.provider';
import { ScrapperProvider } from '../contracts/scrapper.provider';
import { SearchTokensProvider } from '@app/domain/work/contracts/search-tokens.provider';

export interface FetchForNewEpisodeUseCaseJobPayload {
  episode: number;
  id: string;
  url: string;
  name: string;
}

@Injectable()
export class FetchForNewEpisodeUseCase {
  private logger = new Logger(FetchForNewEpisodeUseCase.name);

  constructor(
    private readonly notification: NotificationProvider,
    private readonly scrapper: ScrapperProvider,
    private readonly searchToken: SearchTokensProvider,
  ) {}

  public async execute({
    episode,
    url,
    name,
    id,
  }: FetchForNewEpisodeUseCaseJobPayload) {
    try {
      this.logger.log(`Opening page ${url}`);

      const possibleNextEpisodes = this.predictingNextEpisodeList(episode);

      const tokens = await this.searchToken.getSearchTokens('ANIME');

      const mappedPossibleEpisodes = possibleNextEpisodes.map((ep) => ({
        episodeNumber: ep,
        matchers: this.stringMatchFilterList(ep, tokens),
      }));

      console.log(mappedPossibleEpisodes);

      const html = await this.scrapper.extractHtmlFromUrl(url);

      const newEpisode = find(mappedPossibleEpisodes, (possibleChapter) =>
        some(possibleChapter.matchers, (string) => html.includes(string)),
      );

      if (!!newEpisode) {
        this.logger.log(
          `Found new episode for ${name} - ${id} New episode: ${newEpisode}`,
        );

        await this.notification.notifyNewChapterUnread(
          id,
          newEpisode.episodeNumber,
        );
      } else {
        this.logger.warn(`No new episode for ${name} - ${id}`);
      }

      await this.notification.notifyScrappingReport(id, 'success');
    } catch (e) {
      console.log(e);
      await this.notification.notifyScrappingReport(id, 'error');
    }
  }

  public stringMatchFilterList = (episode: number, tokens: string[]) => {
    const parsedEpisode = episode.toString();

    const episodeTokens = Array.from({ length: 4 }).map((_, index) =>
      parsedEpisode.padStart(index, '0'),
    );

    return tokens.flatMap((token) => {
      return episodeTokens.map((episodeToken) => token.concat(episodeToken));
    });
  };

  public predictingNextEpisodeList(currentEpisode: number) {
    let value = currentEpisode;

    return Array.from({ length: 10 }, () => Number((value += 0.1).toFixed(1)));
  }
}
