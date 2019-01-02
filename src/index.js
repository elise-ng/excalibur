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

app.use(cookieParser())

app.get('/:scopes', async (req, res) => {
  try {
    // check user auth exist
    const user = auth(req)
    if (!user || !user.name || !user.pass) {
      throw new HttpError(401, 'username or password empty')
    }

    // check scopes
    const validScopes = ['grades', 'program_info']
    /** @type {string[]} */
    const scopes = req.params.scopes.split(',').filter(scope => validScopes.includes(scope))
    if (scopes.length <= 0) { throw new HttpError(400, 'scopes invalid or empty') }

    // launch browser
    const browser = await puppeteer.launch({ devtools: IS_DEVELOPMENT })
    const page = (await browser.pages())[0]

    // login
    let cookies = []
    try { cookies = JSON.parse(req.cookies.forwardedCookies) } catch (e) { }
    cookies = await crawler.login(page, user.name, user.pass, cookies)
    const expireDate = new Date()
    expireDate.setDate(expireDate.getDate() + COOKIE_EXPIRE_DAYS)
    res.cookie('forwardedCookies', JSON.stringify(cookies), {
      expires: expireDate,
      secure: !IS_DEVELOPMENT
    })

    // handle scopes
    let payload = { success: true }
    if (scopes.includes('grades')) {
      payload['grades'] = (await crawler.getGrades(page)).map(html => parser.parseGrades(html))
    }
    if (scopes.includes('program_info')) {
      payload['program_info'] = parser.parseStudentProgramInfo(await crawler.getStudentProgramInfo(page))
    }

    // deliver payload
    res.status(200).json(payload)

    // close browser
    await browser.close()
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

const port = process.env.PORT || 8080
app.listen(port)
console.log(`App listening on port ${port}`)
