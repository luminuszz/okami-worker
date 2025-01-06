import { SearchTokensProvider } from '@app/domain/work/contracts/search-tokens.provider';
import { Injectable, Logger } from '@nestjs/common';
import { find, some } from 'lodash';
import { NotificationProvider } from '../contracts/notification.provider';
import { ScrapperProvider } from '../contracts/scrapper.provider';

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

      const html = await this.scrapper.extractHtmlFromUrl(url);

      const newEpisode = find(mappedPossibleEpisodes, (possibleChapter) =>
        some(possibleChapter.matchers, (rxg) => rxg.test(html)),
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
      this.logger.error(
        `Error on fetch for new chapter ${name} ${episode}`,
        e.message,
      );
      await this.notification.notifyScrappingReport(id, 'error');
    }
  }

  public stringMatchFilterList = (episode: number, tokens: string[]) => {
    const parsedEpisode = episode.toString();

    const episodeTokens = Array.from({ length: 4 }).map((_, index) =>
      parsedEpisode.padStart(index, '0'),
    );

    return tokens.flatMap((token) => {
      return episodeTokens.map(
        (episodeToken) => new RegExp(`${token}\\s+${episodeToken}`, 'g'),
      );
    });
  };

  public predictingNextEpisodeList(currentEpisode: number) {
    let value = currentEpisode;

    return Array.from({ length: 10 }, () => Number((value += 0.1).toFixed(1)));
  }
}
