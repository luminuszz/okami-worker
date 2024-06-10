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

    const browserProxyConnection = this.config.get<string>('SCRAPPER_BROWSER');

    if (!!browserProxyConnection) {
      browser = await puppeteer.connect({
        browserWSEndpoint: browserProxyConnection,
      });
    } else {
      const args: string[] = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
      ];

      browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: true,
        args,
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
