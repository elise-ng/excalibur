import express from 'express'
import puppeteer from 'puppeteer'
import HttpError from 'http-errors'
import auth from 'basic-auth'
import * as crawler from './crawler'
import * as parser from './parser'

const app = express()

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

    // init context and page
    const browser = await puppeteer.launch({ devtools: process.env.NODE_ENV === 'development' })
    await (await browser.pages())[0].close() // close default about:blank page
    const context = await browser.createIncognitoBrowserContext()
    const page = await context.newPage()

    // login
    await crawler.login(page, user.name, user.pass)

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

    // destroy context and page
    await context.close()
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