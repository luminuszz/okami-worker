import { ScrapperProvider } from '@app/domain/work/contracts/scrapper.provider';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { connect } from 'puppeteer-real-browser';

@Injectable()
export class PuppeteerScrapperProvider implements ScrapperProvider {
  constructor(private readonly config: ConfigService) {}

  private logger = new Logger(PuppeteerScrapperProvider.name);

  async extractHtmlFromUrl(url: string): Promise<string> {
    const { browser, page } = await connect({
      headless: true,
      turnstile: true,
      disableXvfb: false,
      plugins: [StealthPlugin()],
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });

      const html = await page.evaluate(() => {
        const doc = new DOMParser().parseFromString(
          document.body.innerHTML,
          'text/html',
        );

        return doc.body.textContent;
      });

      const content = cheerio.load(html);

      await page.close();

      return content.html();
    } catch (e) {
      throw {
        message: e.message,
        url,
      };
    } finally {
      await browser.close();
    }
  }
}
