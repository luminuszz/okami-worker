export abstract class ScrapperProvider {
  abstract extractHtmlFromUrl(url: string): Promise<string>;
  abstract close(): Promise<void>;
}
