import { Injectable } from '@nestjs/common';
import { QueueProvider } from '../contracts/queue.provider';
import {
  FetchForNewEpisodeUseCase,
  FetchForNewEpisodeUseCaseJobPayload,
} from '../useCases/fetch-for-new-episodde';
import {
  FetchForNewChapterUseCase,
  CheckWithExistsNewChapterDto,
} from '../useCases/fetch-for-new-chapter';

enum Jobs {
  findSerieEpisode = 'find-serie-episode',
  findMangaChapter = 'find-comic-cap-by-url',
}

@Injectable()
export class Queue {
  constructor(
    private readonly queueProvider: QueueProvider,
    private readonly fetchForNewEpisode: FetchForNewEpisodeUseCase,
    private readonly fetchForNewChapter: FetchForNewChapterUseCase,
  ) {
    this.queueProvider.registerWorker<FetchForNewEpisodeUseCaseJobPayload>(
      Jobs.findSerieEpisode,
      (data) => this.fetchForNewEpisode.execute(data),
    );

    this.queueProvider.registerWorker<CheckWithExistsNewChapterDto>(
      Jobs.findMangaChapter,
      (data) => this.fetchForNewChapter.execute(data),
    );
  }
}
