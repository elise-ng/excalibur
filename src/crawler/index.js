// eslint-disable-next-line no-unused-vars
import puppeteer from 'puppeteer' // keep here for auto suggestion
import _ from 'lodash'
import HttpError from 'http-errors'

const URL_SIS_LOGIN = 'https://sisprod.psft.ust.hk/psp/SISPROD/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL?pslnkid=Z_HC_SSS_STUDENT_CENTER_LNK&FolderPath=PORTAL_ROOT_OBJECT.Z_HC_SSS_STUDENT_CENTER_LNK&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder'
const URL_CAS_2FA = 'https://cas.ust.hk/cas/js/duo/Duo-Web-v2.min.js'
const URL_SIS_HOME = 'https://sisprod.psft.ust.hk/psc/SISPROD/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL?pslnkid=Z_HC_SSS_STUDENT_CENTER_LNK&FolderPath=PORTAL_ROOT_OBJECT.Z_HC_SSS_STUDENT_CENTER_LNK&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder&PortalActualURL=https%3a%2f%2fsisprod.psft.ust.hk%2fpsc%2fSISPROD%2fEMPLOYEE%2fHRMS%2fc%2fSA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL%3fpslnkid%3dZ_HC_SSS_STUDENT_CENTER_LNK&PortalContentURL=https%3a%2f%2fsisprod.psft.ust.hk%2fpsc%2fSISPROD%2fEMPLOYEE%2fHRMS%2fc%2fSA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL%3fpslnkid%3dZ_HC_SSS_STUDENT_CENTER_LNK&PortalContentProvider=HRMS&PortalCRefLabel=Student%20Center&PortalRegistryName=EMPLOYEE&PortalServletURI=https%3a%2f%2fsisprod.psft.ust.hk%2fpsp%2fSISPROD%2f&PortalURI=https%3a%2f%2fsisprod.psft.ust.hk%2fpsc%2fSISPROD%2f&PortalHostNode=HRMS&NoCrumbs=yes'
const URL_SIS_GRADES = 'https://sisprod.psft.ust.hk/psc/SISPROD/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSR_SSENRL_GRADE.GBL'
const URL_STU_PROG_INFO = 'https://w5.ab.ust.hk/jsga/graduation'
const URL_COOKIE_SISPROD = 'https://sisprod.psft.ust.hk'
const URL_COOKIE_LOGIN_PSFT = 'https://login.psft.ust.hk/cas'
const URL_COOKIE_CAS = 'https://cas.ust.hk/cas'
const URL_COOKIE_2FA = 'https://api-84f626fe.duosecurity.com'
const URLS_COOKIE = [URL_COOKIE_SISPROD, URL_COOKIE_LOGIN_PSFT, URL_COOKIE_CAS, URL_COOKIE_2FA]
const TIMEOUT_2FA = 3 * 60 * 1000

/**
 * SIS Login Routine
 * @param {puppeteer.Page} page
 * @param {String} username
 * @param {String} password
 * @param {puppeteer.Cookie[]} cookies
 * @return {puppeteer.Cookie[]} array of cookie objects
 */
export async function login (page, username, password, cookies) {
  const SELECTOR_LOGIN_FORM = 'form[id="fm1"]'
  const SELECTOR_SIS_HOME = `frame[src="${URL_SIS_HOME}"]`
  try {
    await page.setCookie(...cookies)
    await Promise.all([page.goto(URL_SIS_LOGIN), Promise.race([page.waitFor(SELECTOR_LOGIN_FORM), page.waitFor(SELECTOR_SIS_HOME)])])
    // FIXME: program info cookie not working, better cookie validation needed
    if (await page.$(SELECTOR_LOGIN_FORM) !== null) {
      await page.focus('#userNameInput')
      await page.keyboard.type(username)
      await page.focus('#passwordInput')
      await page.keyboard.type(password)
      await page.click('#submitButton')
      const response = await Promise.race([page.waitForResponse(URL_CAS_2FA), page.waitForResponse(res => res.status() === 401)])
      if (response.status() === 401) { throw new HttpError(401) }
      // FIXME: 2fa cookie not working, button disabled / selector not working
      // await page.click('.stay-logged-in input[name="dampen_choice"]')
      await page.waitFor(SELECTOR_SIS_HOME, { timeout: TIMEOUT_2FA })
    }
    // FIXME: cas cookie not working, seems can't be captured
    return await page.cookies(...URLS_COOKIE)
  } catch (e) {
    throw e
  }
}

/**
 * SIS Grades Crawling Routine
 * @param {puppeteer.Page} page
 * @returns {string[]} html strings of grade pages
 */
export async function getGrades (page) {
  const SELECTOR_TERM_TABLE = 'table[id="SSR_DUMMY_RECV1$scroll$0"]'
  const SELECTOR_GRADE_TABLE = 'table[id="TERM_CLASSES$scroll$0"]'
  const SELECTOR_CHANGE_TERM_BUTTON = '#DERIVED_SSS_SCT_SSS_TERM_LINK'
  const SELECTOR_TERM_INPUT = 'input[name="SSR_DUMMY_RECV1$sels$0"]'
  const SELECTOR_CONTINUE_BUTTON = '#DERIVED_SSS_SCT_SSR_PB_GO'
  try {
    await Promise.all([page.goto(URL_SIS_GRADES), Promise.race([page.waitFor(SELECTOR_TERM_TABLE), page.waitFor(SELECTOR_GRADE_TABLE)])])
    if (await page.$(SELECTOR_TERM_TABLE) === null) {
      // landed on current term result
      if (await page.$(SELECTOR_CHANGE_TERM_BUTTON) !== null) {
        // change term button available => go to term list
        await Promise.all([page.click(SELECTOR_CHANGE_TERM_BUTTON), page.waitForNavigation()])
      } else {
        // change term button unavailable (year 1 fall sem special case) => return current sem only
        return [await page.content()]
      }
    }
    // main routine: loop through each term
    let results = []
    const numOfTerms = await page.$$eval(SELECTOR_TERM_INPUT, elems => elems.length)
    for (const termId of _.range(0, numOfTerms)) {
      await page.click(`${SELECTOR_TERM_INPUT}[value="${termId}"]`)
      await Promise.all([page.click(SELECTOR_CONTINUE_BUTTON), page.waitForNavigation()])
      results.push(await page.content())
      await Promise.all([page.click(SELECTOR_CHANGE_TERM_BUTTON), page.waitForNavigation()])
    }
    return results
  } catch (e) {
    throw e
  }
}

/**
 * Student Program Info Crawling Routine
 * @param {puppeteer.Page} page
 * @returns {string} html string
 */
export async function getStudentProgramInfo (page) {
  try {
    await Promise.all([page.goto(URL_STU_PROG_INFO), page.waitFor('div[class="panel panel-default"]')])
    return await page.content()
  } catch (e) {
    throw e
  }
}
