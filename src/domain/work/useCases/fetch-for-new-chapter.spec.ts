import { beforeEach, describe, expect, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { FetchForNewChapterUseCase } from '@app/domain/work/useCases/fetch-for-new-chapter';

const fakeScrapperProvider = {
  extractHtmlFromUrl: vi.fn(),
  close: vi.fn(),
};
const fakeNotificationProvider = {
  notifyNewChapterUnread: vi.fn(),
  notifyScrappingReport: vi.fn(),
};

describe('FetchForNewChapter', () => {
  let stu: FetchForNewChapterUseCase;

  beforeEach(() => {
    stu = new FetchForNewChapterUseCase(
      fakeNotificationProvider,
      fakeScrapperProvider,
    );
  });

  it('should be able to notify api with new chapter found', async () => {
    const cap = faker.number.int({ min: 1, max: 100 });

    fakeScrapperProvider.extractHtmlFromUrl.mockReturnValue(`cap ${cap + 1}`);

    await stu.execute({
      name: faker.internet.domainName(),
      cap,
      url: faker.internet.url(),
      id: faker.string.uuid(),
    });

    expect(fakeNotificationProvider.notifyNewChapterUnread).toBeCalledTimes(1);
  });

  it('should not be able to notify if scrapper not found any new chapter', async () => {
    const cap = faker.number.int({ min: 1, max: 100 });

    fakeScrapperProvider.extractHtmlFromUrl.mockReturnValue(`NO HAVE NEW CAP`);

    await stu.execute({
      name: faker.internet.domainName(),
      cap,
      url: faker.internet.url(),
      id: faker.string.uuid(),
    });

    expect(fakeNotificationProvider.notifyNewChapterUnread).toBeCalledTimes(0);
  });

  it('should be able to get a list for possible next chapters numbers by original chapter number', () => {
    const randomChapter = faker.number.int({ min: 1, max: 100 });

    const results = stu.predictingNextChapterList(randomChapter);

    expect(results.length).toBe(10);
    expect(results[0]).toBe(randomChapter + 0.1);
    expect(results[9]).toBe(randomChapter + 1);
  });

  it('should be able to get a list for possible chapters matchers string', () => {
    const randomChapter = faker.number.int({ min: 1, max: 100 });

    const results = stu.stringMatchFilterList(randomChapter);

    results.forEach((matcher) => {
      expect(matcher).toContain(randomChapter.toString());
    });
  });
});
