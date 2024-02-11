import { beforeEach, describe, expect, vi, it } from 'vitest';
import { faker } from '@faker-js/faker';
import { FetchForNewEpisodeUseCase } from '@app/domain/work/useCases/fetch-for-new-episodde';

const fakeScrapperProvider = {
  extractHtmlFromUrl: vi.fn(),
  close: vi.fn(),
};
const fakeNotificationProvider = {
  notifyNewChapterUnread: vi.fn(),
  notifyScrappingReport: vi.fn(),
};

describe('FetchForNewEpisode', () => {
  let stu: FetchForNewEpisodeUseCase;

  beforeEach(() => {
    stu = new FetchForNewEpisodeUseCase(
      fakeNotificationProvider,
      fakeScrapperProvider,
    );
  });

  it('should be able to notify api with new episode found', async () => {
    const episode = faker.number.int({ min: 1, max: 100 });

    fakeScrapperProvider.extractHtmlFromUrl.mockReturnValue(
      `Ep ${episode + 1}`,
    );

    await stu.execute({
      name: faker.internet.domainName(),
      episode,
      url: faker.internet.url(),
      id: faker.string.uuid(),
    });

    expect(fakeNotificationProvider.notifyNewChapterUnread).toBeCalledTimes(1);
  });

  it('should not be able to notify if scrapper not found any new episode', async () => {
    const episode = faker.number.int({ min: 1, max: 100 });

    fakeScrapperProvider.extractHtmlFromUrl.mockReturnValue(
      `NO HAVE NEW EPISODE`,
    );

    await stu.execute({
      name: faker.internet.domainName(),
      episode,
      url: faker.internet.url(),
      id: faker.string.uuid(),
    });

    expect(fakeNotificationProvider.notifyNewChapterUnread).toBeCalledTimes(0);
  });

  it('should be able to get a list for possible next episodes numbers by original episode number', () => {
    const randomChapter = faker.number.int({ min: 1, max: 100 });

    const results = stu.predictingNextEpisodeList(randomChapter);

    expect(results.length).toBe(10);
    expect(results[0]).toBe(randomChapter + 0.1);
    expect(results[9]).toBe(randomChapter + 1);
  });

  it('should be able to get a list for possible episodes matchers string', () => {
    const randomChapter = faker.number.int({ min: 1, max: 100 });

    const results = stu.stringMatchFilterList(randomChapter);

    results.forEach((matcher) => {
      expect(matcher).toContain(randomChapter.toString());
    });
  });
});
