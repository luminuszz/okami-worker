import { NotificationProvider } from '../../domain/work/contracts/notification.provider';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { QueueProvider } from '@app/domain/work/contracts/queue.provider';

@Injectable()
export class OkamiHttpNotificationProvider implements NotificationProvider {
  constructor(
    private httpService: HttpService,
    private readonly queueProvider: QueueProvider,
  ) {}

  private logger = new Logger(OkamiHttpNotificationProvider.name);

  async notifyNewChapterUnread(
    workId: string,
    nextChapter: number,
  ): Promise<void> {
    await this.httpService.axiosRef.patch(`/work/${workId}/mark-unread`, {
      nextChapter,
    });
  }

  async notifyScrappingReport(
    workId: string,
    status: 'success' | 'error',
  ): Promise<void> {
    this.logger.log(
      `Notifying scrapping report for work ${workId} with status ${status}`,
    );

    await this.queueProvider.publish('refresh-work-scrapping-status', {
      workId,
      status,
    });
  }
}
