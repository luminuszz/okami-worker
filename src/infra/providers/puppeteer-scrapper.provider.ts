import { ScrapperProvider } from '@app/domain/work/contracts/scrapper.provider';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Browser } from 'puppeteer-core';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { connect } from 'puppeteer-real-browser';

@Injectable()
export class PuppeteerScrapperProvider
  implements ScrapperProvider, OnModuleDestroy
{
  constructor(private readonly config: ConfigService) {}

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private browser: Browser;

  private logger = new Logger(PuppeteerScrapperProvider.name);

  async extractHtmlFromUrl(url: string): Promise<string> {
    if (!this.browser) {
      const { browser } = await connect({
        headless: true,
        turnstile: true,
        disableXvfb: false,
        plugins: [StealthPlugin()],
      });

      this.browser = browser as unknown as Browser;
    }

    try {
      const page = await this.browser.newPage();

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 50000,
      });

      const html = await page.content();

      writeFileSync(
        resolve(
          __dirname,
          '..',
          '..',
          '..',
          'temp',
          `${url.replaceAll('/', '-')}.html`,
        ),
        html,
      );

      await page.close();

      return html;
    } catch (e) {
      throw {
        message: e.message,
        url,
      };
    }
  }
}
