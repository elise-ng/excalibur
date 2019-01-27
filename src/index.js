import express from 'express'
import puppeteer from 'puppeteer'
import HttpError from 'http-errors'
import auth from 'basic-auth'
import cookieParser from 'cookie-parser'
import * as crawler from './crawler'
import * as parser from './parser'

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'
const COOKIE_EXPIRE_DAYS = 14

const app = express()

/** @type puppeteer.Browser */
let browser = null

app.use(cookieParser())

app.get('/:scopes', async (req, res) => {
  try {
    // check user auth exist
    const user = auth(req)
    if (!user || !user.name || !user.pass) {
      throw new HttpError(401, 'username or password empty')
    }

    // check scopes
    const validScopes = ['all', 'grades', 'program_info', 'schedule']
    /** @type {string[]} */
    const scopes = req.params.scopes.split(',').filter(scope => validScopes.includes(scope))
    if (scopes.length <= 0) { throw new HttpError(400, 'scopes invalid or empty') }
    let isAllScope = scopes.includes('all')

    // launch private context
    const context = await browser.createIncognitoBrowserContext()
    const page = await context.newPage()

    // close context on connection close by client
    req.on('close', async () => {
      try {
        await context.close()
      } catch (e) {
        console.error(e.stack)
      }
    })

    // login
    let cookies = []
    // use forwarded cookies if program_info is not requested
    try { cookies = isAllScope || scopes.includes('program_info') ? [] : JSON.parse(req.cookies.forwardedCookies) } catch (e) { }
    cookies = await crawler.login(page, user.name, user.pass, cookies)
    const expireDate = new Date()
    expireDate.setDate(expireDate.getDate() + COOKIE_EXPIRE_DAYS)
    res.cookie('forwardedCookies', JSON.stringify(cookies), {
      expires: expireDate,
      secure: !IS_DEVELOPMENT
    })

    // handle scopes
    let result = { success: true }
    if (isAllScope || scopes.includes('grades')) {
      result.grades = (await crawler.getGrades(page)).map(html => parser.parseGrades(html))
    }
    if (isAllScope || scopes.includes('schedule')) {
      let statusFilter = req.query.course_status || 'enrolled'
      statusFilter = statusFilter.split(' ')
      result.schedule = (await crawler.getSchedule(page, statusFilter)).map(html => parser.parseSchedule(html))
    }
    if (isAllScope || scopes.includes('program_info')) {
      result.program_info = parser.parseStudentProgramInfo(await crawler.getStudentProgramInfo(page))
    }

    // deliver result
    res.status(200).json(result)
  } catch (e) {
    if (e instanceof HttpError.HttpError) {
      res.status(e.status).json({
        success: false,
        error: e.message
      })
    } else {
      console.error(e.stack)
      res.status(500).json({
        success: false,
        error: `Internal server error: ${e.toString()}`
      })
    }
  }
})

async function main () {
  try {
    // init global browser
    browser = await puppeteer.launch({ devtools: IS_DEVELOPMENT })
    await (await browser.pages())[0].close() // close default about:blank page
    console.log('Browser initialized')
    // start accepting requests
    const port = process.env.PORT || 8080
    app.listen(port)
    console.log(`App listening on port ${port}`)
  } catch (e) {
    console.error(e.stack)
  }
}

main()

process.on('exit', () => {
  browser.close()
})
