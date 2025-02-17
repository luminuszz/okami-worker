import { ScrapperProvider } from '@app/domain/work/contracts/scrapper.provider';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { load } from 'cheerio';
import { Browser } from 'puppeteer-core';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { connect } from 'puppeteer-real-browser';
import { providersSelectors } from '@app/constants';

@Injectable()
export class PuppeteerScrapperProvider
  implements ScrapperProvider, OnModuleDestroy
{
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

      const htmlRaw = await page.content();

      // this phase of sites using server-side rendering ${evalResults}

      const evalResults = await page.evaluate(() => {
        const doc = new DOMParser().parseFromString(
          document.body.innerHTML,
          'text/html',
        );

        return doc.body.textContent;
      });

      await page.close();

      const providerSelector = Object.entries(providersSelectors).find(
        ([key]) => url.includes(key),
      );

      if (!!providerSelector?.length) {
        const [provider, existsSelector] = providerSelector;

        this.logger.log(`Selector found: ${provider} ${existsSelector}`);

        const $serverSideHtml = load(evalResults)(existsSelector);

        return htmlRaw.concat($serverSideHtml.html());
      }

      const parsedHtml = load(evalResults);

      return htmlRaw.concat(parsedHtml.html());
    } catch (e) {
      console.log(e);
      throw {
        message: e.message,
        url,
        stack: e,
      };
    }
  }
}
