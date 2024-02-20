export abstract class NotificationProvider {
  abstract notifyNewChapterUnread(
    workId: string,
    nextChapter: number,
  ): Promise<void>;

  abstract notifyScrappingReport(
    workId: string,
    status: 'success' | 'error',
  ): Promise<void>;
}
