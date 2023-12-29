import { Module } from '@nestjs/common';
import { QueueProvider } from '../domain/work/contracts/queue.provider';
import { SqsQueueProvider } from './providers/sqs-queue.provider';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotificationProvider } from '../domain/work/contracts/notification.provider';
import { OkamiHttpNotificationProvider } from './providers/okami-http-notification.provider';
import { ScrapperProvider } from '../domain/work/contracts/scrapper.provider';
import { PuppeteerScrapperProvider } from './providers/puppeteer-scrapper.provider';
import { FetchForNewChapterUseCase } from '../domain/work/useCases/fetch-for-new-chapter';
import { FetchForNewEpisodeUseCase } from '../domain/work/useCases/fetch-for-new-episodde';
import { Queue } from '../domain/work/queue/Queue';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        baseURL: config.get('OKAMI_BASE_URL'),
        headers: {
          accesstoken: config.get('OKAMI_API_ACCESS_TOKEN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],

  providers: [
    {
      provide: QueueProvider,
      useClass: SqsQueueProvider,
    },
    {
      provide: NotificationProvider,
      useClass: OkamiHttpNotificationProvider,
    },
    {
      provide: ScrapperProvider,
      useClass: PuppeteerScrapperProvider,
    },

    FetchForNewChapterUseCase,
    FetchForNewEpisodeUseCase,
    Queue,
  ],
})
export class InfraModule {}
