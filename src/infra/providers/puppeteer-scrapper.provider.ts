import { ScrapperProvider } from '@app/domain/work/contracts/scrapper.provider';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import puppeteer, { Browser } from 'puppeteer-core';

@Injectable()
export class PuppeteerScrapperProvider implements ScrapperProvider {
  constructor(private readonly config: ConfigService) {}

  private logger = new Logger(PuppeteerScrapperProvider.name);

  async extractHtmlFromUrl(url: string): Promise<string> {
    let browser: Browser;

    const useProxy = !!this.config.get('SCRAPPER_BROWSER');

    if (useProxy) {
      browser = await puppeteer.connect({
        browserWSEndpoint: this.config.get('SCRAPPER_BROWSER'),
      });
    } else {
      browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: true,
      });
    }

    try {
      const page = await browser.newPage();

      this.logger.log(`Opening page ${url}`);

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
