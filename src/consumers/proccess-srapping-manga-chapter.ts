import 'dotenv/config';
import { createConsumer, getAppInstance, getQueueUrl } from './utils';
import { FetchForNewChapterUseCase } from '../domain/work/useCases/fetch-for-new-chapter';

const queueUrl = getQueueUrl('find-comic-cap-by-url');

const consumer = createConsumer(queueUrl, async (payload) => {
  const app = await getAppInstance();

  const worker = await app.resolve(FetchForNewChapterUseCase);
  await worker.execute(payload);
});

consumer.on('started', () => console.log('Consumer started!'));
consumer.on('error', (err) => console.error(err.message));
consumer.on('message_processed', (message) =>
  console.log(`Message processed! ${JSON.parse(message.Body)?.name}`),
);
consumer.on('message_received', (message) =>
  console.log(`message_received! ${JSON.parse(message.Body)?.name}`),
);

if (!consumer.isRunning) {
  consumer.start();
}
