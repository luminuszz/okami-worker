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

      const mappedPossibleEpisodes = possibleNextEpisodes.map((ep) => ({
        episodeNumber: ep,
        matchers: this.stringMatchFilterList(ep),
      }));

      const html = await this.scrapper.extractHtmlFromUrl(url);

      const newEpisode = find(mappedPossibleEpisodes, (possibleChapter) =>
        some(possibleChapter.matchers, (string) => html.includes(string)),
      );

      if (!!newEpisode) {
        this.logger.log(`Found new episode for ${name} - ${id}`);
        this.logger.log(`New episode: ${newEpisode}`);

        await this.notification.notifyNewChapterUnread(
          id,
          newEpisode.episodeNumber,
        );
      } else {
        this.logger.warn(`No new episode for ${name} - ${id}`);
      }

      await this.notification.notifyScrappingReport(id, "success")
    } catch (e) {
      await this.notification.notifyScrappingReport(id, "error")

    }
  }

  public stringMatchFilterList = (episode: number) => {
    const parsedEpisode = episode.toString();
    return [
      `Episódio ${parsedEpisode}`,
      `Ep ${parsedEpisode}`,
      `Eps ${parsedEpisode}`,
      `episódio ${parsedEpisode}`,
      `ep. ${parsedEpisode}`,
      `Ep ${parsedEpisode}`,
      `Ep. ${parsedEpisode}`,
    ];
  };

  public predictingNextEpisodeList(currentEpisode: number) {
    let value = currentEpisode;

    return Array.from({ length: 10 }, () => Number((value += 0.1).toFixed(1)));
  }
}
