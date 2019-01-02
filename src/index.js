import puppeteer from 'puppeteer'
import * as crawler from './crawler'
import * as parser from './parser'
import config from '../config.json'

/**
 * Async Entrypoint
 */
async function main () {
  try {
    const browser = await puppeteer.launch({ devtools: process.env.NODE_ENV === 'development' })
    await (await browser.pages())[0].close() // close default about:blank page
    const context = await browser.createIncognitoBrowserContext()
    const page = await context.newPage()
    await crawler.login(page, config.username, config.password)
    const htmls = await crawler.getGrades(page)
    console.log(JSON.stringify(htmls.map(html => parser.parseGrades(html)), null, '\t'))
    await context.close()
    await browser.close()
  } catch (e) {
    console.error(e)
  }
}

main()
