import { ScrapperProvider } from '@app/domain/work/contracts/scrapper.provider';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as cheerio from 'cheerio';
import puppeteer, { Browser } from 'puppeteer-core';

@Injectable()
export class PuppeteerScrapperProvider
  implements ScrapperProvider, OnModuleDestroy
{
  async close(): Promise<void> {
    await this.browser.close();
  }
  private logger = new Logger(PuppeteerScrapperProvider.name);

  private browser: Browser;

  async extractHtmlFromUrl(url: string): Promise<string> {
    try {
      const browser = await this.initializeBrowser();

      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 5.1; rv:5.0) Gecko/20100101 Firefox/5.0',
      );

      this.logger.log(`Opening page ${url}`);

      await page.goto(url, { waitUntil: 'networkidle2' });

      const html = await page.evaluate(() => document.body.innerHTML);

      const content = cheerio.load(html);

      await page.close();

      return content.html();


    } catch (e) {
      throw {
        message: e.message,
        url,
      };
    }
  }

  private async initializeBrowser() {
    if (!this.browser) {
      const args: string[] = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
      ];

      this.logger.debug('creating new browser instance');

      this.browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/usr/bin/google-chrome',
        args,
      });
    }

    return this.browser;
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
