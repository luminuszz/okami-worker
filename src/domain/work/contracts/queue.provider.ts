export abstract class QueueProvider {
  abstract registerWorker<Payload = any>(
    name: string,
    callback: (payload: Payload) => Promise<void> | void,
  ): void;

  abstract publish<Payload = unknown>(
    name: string,
    payload: Payload,
  ): Promise<void> | void;
}
