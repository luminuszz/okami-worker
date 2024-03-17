import { Injectable, Logger } from '@nestjs/common';
import { NotificationProvider } from '../contracts/notification.provider';
import { ScrapperProvider } from '../contracts/scrapper.provider';
import { find, some } from 'lodash';

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
  ) {}

  public stringMatchFilterList = (chapter: number) => {
    const chapterString = chapter.toString();

    return [
      `Capítulo ${chapterString}`,
      `Cap ${chapterString}`,
      `cap ${chapterString}`,
      `capítulo ${chapterString}`,
      `cap. ${chapterString}`,
      `Cap. ${chapterString}`,
      `Cap. ${chapterString}`,
      `CAP. ${chapterString}`,
      `CAP.${chapterString}`,
    ];
  };

  public predictingNextChapterList(currentCap: number) {
    let value = currentCap;

    return Array.from({ length: 10 }, () => Number((value += 0.1).toFixed(1)));
  }

  public async execute({ cap, id, name, url }: CheckWithExistsNewChapterDto) {
    try {
      const possibleNextChapters = this.predictingNextChapterList(cap);

      this.logger.log(`verify for new chapters ${name} ${cap}`);

      const mappedPossibleChapters = possibleNextChapters.map((cap) => ({
        capNumber: cap,
        matchers: this.stringMatchFilterList(cap),
      }));

      const html = await this.scrapper.extractHtmlFromUrl(url);

      const newChapter = find(mappedPossibleChapters, (possibleChapter) =>
        some(possibleChapter.matchers, (string) => html.includes(string)),
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

      await this.notification.notifyScrappingReport(id, 'error');
    }
  }
}
