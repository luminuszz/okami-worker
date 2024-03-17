export abstract class ScrapperProvider {
  abstract extractHtmlFromUrl(url: string): Promise<string>;
}
