import { SearchTokensProvider } from '@app/domain/work/contracts/search-tokens.provider';
import { Injectable, Logger } from '@nestjs/common';
import { find, some } from 'lodash';
import { NotificationProvider } from '../contracts/notification.provider';
import { ScrapperProvider } from '../contracts/scrapper.provider';

export interface CheckWithExistsNewChapterDto {
  id: string;
  url: string;
  cap: number;

  name: string;
}

@Injectable()
export class FetchForNewChapterUseCase {
  private readonly logger = new Logger(FetchForNewChapterUseCase.name);

  constructor(
    private readonly notification: NotificationProvider,
    private readonly scrapper: ScrapperProvider,
    private readonly searchToken: SearchTokensProvider,
  ) {}

  public stringMatchFilterList = (chapter: number, tokens: string[]) => {
    const parsedChapter = chapter.toString();

    const chapterTokens = Array.from({ length: 4 }).map((_, index) =>
      parsedChapter.padStart(index, '0'),
    );

    return tokens.flatMap((token) => {
      return chapterTokens.map(
        (chapterToken) => new RegExp(`${token}\\s+${chapterToken}`, 'g'),
      );
    });
  };

  public predictingNextChapterList(currentCap: number) {
    let value = currentCap;

    return Array.from({ length: 10 }, () => Number((value += 0.1).toFixed(1)));
  }

  public async execute({ cap, id, name, url }: CheckWithExistsNewChapterDto) {
    try {
      const possibleNextChapters = this.predictingNextChapterList(cap);

      this.logger.log(`verify for new chapters ${name} ${cap}`);

      const tokens = await this.searchToken.getSearchTokens('MANGA');

      const mappedPossibleChapters = possibleNextChapters.map((cap) => ({
        capNumber: cap,
        matchers: this.stringMatchFilterList(cap, tokens),
      }));

      const html = await this.scrapper.extractHtmlFromUrl(url);

      const newChapter = find(mappedPossibleChapters, (possibleChapter) =>
        some(possibleChapter.matchers, (regex) => {
          return regex.test(html);
        }),
      );

      if (!!newChapter) {
        await this.notification.notifyNewChapterUnread(
          id,
          newChapter.capNumber,
        );

        this.logger.log(
          `Found new chapter for ${name}, chapter -> ${newChapter.capNumber}, marked as unread`,
        );
      } else {
        this.logger.warn(`not found new chapter for ${name}`);
      }

      await this.notification.notifyScrappingReport(id, 'success');
    } catch (e) {
      this.logger.error(
        `Error on fetch for new chapter ${name} ${cap}`,
        JSON.stringify(e.message),
      );

      await this.notification.notifyScrappingReport(
        id,
        'error',
        JSON.stringify(e.message),
      );
    }
  }
}
