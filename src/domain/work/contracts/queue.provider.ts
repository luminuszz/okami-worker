export abstract class QueueProvider {
  abstract registerWorker<Payload = any>(
    name: string,
    callback: (payload: Payload) => Promise<void> | void,
  ): void;
}
