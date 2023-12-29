import { NotificationProvider } from '../../domain/work/contracts/notification.provider';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class OkamiHttpNotificationProvider implements NotificationProvider {

  constructor(private httpService: HttpService) {}

  async notifyNewChapterUnread(
    workId: string,
    nextChapter: number,
  ): Promise<void> {
    await this.httpService.axiosRef.patch(`/work/${workId}/mark-unread`, {
      nextChapter,
    });
  }


  async  notifyScrappingReport(workId: string, status: "success" | "error"): Promise<void> {
    await this.httpService.axiosRef.post("/work/scrapping-report", {
      workId,
      status
    })
  }
}
