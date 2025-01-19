import { NotificationProvider } from '@app/domain/work/contracts/notification.provider';
import { QueueProvider } from '@app/domain/work/contracts/queue.provider';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OkamiHttpNotificationProvider implements NotificationProvider {
  constructor(private readonly queueProvider: QueueProvider) {}

  private logger = new Logger(OkamiHttpNotificationProvider.name);

  async notifyNewChapterUnread(
    workId: string,
    nextChapter: number,
  ): Promise<void> {
    await this.queueProvider.publish('work-new-chapter', {
      nextChapter,
      workId,
    });
  }

  async notifyScrappingReport(
    workId: string,
    status: 'success' | 'error',
    message?: string,
  ): Promise<void> {
    this.logger.log(
      `Notifying scrapping report for work ${workId} with status ${status}`,
    );

    await this.queueProvider.publish('refresh-work-scrapping-status', {
      workId,
      status,
      message: message || null,
    });
  }
}
