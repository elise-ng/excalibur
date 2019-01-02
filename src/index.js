import puppeteer from 'puppeteer'
import * as crawler from './crawler'
import config from '../config.json'

/**
 * Async Entrypoint
 */
async function main () {
  try {
    const browser = await puppeteer.launch({ devtools: true })
    const page = await browser.newPage()
    await crawler.login(page, config.username, config.password)
    console.log(await crawler.getStudentProgramInfo(page))
    await browser.close()
  } catch (e) {
    console.error(e)
  }
}

main()
