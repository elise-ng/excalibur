import puppeteer from 'puppeteer'
import _ from 'lodash'
import config from '../config.json'

const URL_SIS_LOGIN = 'https://sisprod.psft.ust.hk/psp/SISPROD/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL?pslnkid=Z_HC_SSS_STUDENT_CENTER_LNK&FolderPath=PORTAL_ROOT_OBJECT.Z_HC_SSS_STUDENT_CENTER_LNK&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder'
const URL_SIS_HOME = 'https://sisprod.psft.ust.hk/psc/SISPROD/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL?pslnkid=Z_HC_SSS_STUDENT_CENTER_LNK&FolderPath=PORTAL_ROOT_OBJECT.Z_HC_SSS_STUDENT_CENTER_LNK&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder&PortalActualURL=https%3a%2f%2fsisprod.psft.ust.hk%2fpsc%2fSISPROD%2fEMPLOYEE%2fHRMS%2fc%2fSA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL%3fpslnkid%3dZ_HC_SSS_STUDENT_CENTER_LNK&PortalContentURL=https%3a%2f%2fsisprod.psft.ust.hk%2fpsc%2fSISPROD%2fEMPLOYEE%2fHRMS%2fc%2fSA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL%3fpslnkid%3dZ_HC_SSS_STUDENT_CENTER_LNK&PortalContentProvider=HRMS&PortalCRefLabel=Student%20Center&PortalRegistryName=EMPLOYEE&PortalServletURI=https%3a%2f%2fsisprod.psft.ust.hk%2fpsp%2fSISPROD%2f&PortalURI=https%3a%2f%2fsisprod.psft.ust.hk%2fpsc%2fSISPROD%2f&PortalHostNode=HRMS&NoCrumbs=yes'
const URL_SIS_GRADES = 'https://sisprod.psft.ust.hk/psc/SISPROD/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSR_SSENRL_GRADE.GBL'
const TIMEOUT_2FA = 3 * 60 * 1000

/**
 * SIS Login Routine
 * @param {puppeteer.Page} page
 * @param {String} username
 * @param {String} password
 */
async function login (page, username, password) {
  try {
    await Promise.all([page.waitFor('#fm1'), page.goto(URL_SIS_LOGIN)])
    await page.focus('#userNameInput')
    await page.keyboard.type(username)
    await page.focus('#passwordInput')
    await page.keyboard.type(password)
    await page.click('#submitButton')
    const response = await Promise.race([page.waitForResponse(URL_SIS_HOME, { timeout: TIMEOUT_2FA }), page.waitForResponse(res => res.status() === 401)])
    if (response.status() === 401) { throw new Error('401 Unauthorized') }
  } catch (e) {
    throw e
  }
}

/**
 * SIS Grades Crawling Routine
 * @param {puppeteer.Page} page
 */
async function getGrades (page) {
  try {
    await Promise.all([page.waitFor('.PSLEVEL2GRIDWBO'), page.goto(URL_SIS_GRADES)])
    let results = []
    // read term list
    const numOfTerms = await page.$$eval('input[name="SSR_DUMMY_RECV1$sels$0"]', elems => elems.length)
    for (const termId of _.range(0, numOfTerms)) {
      // select term
      await page.click(`input[name="SSR_DUMMY_RECV1$sels$0"][value="${termId}"]`)
      await Promise.all([page.click('#DERIVED_SSS_SCT_SSR_PB_GO'), page.waitForNavigation()])
      // save html for term result
      results.push(await page.content())
      // click change term and return to term list
      await Promise.all([page.click('#DERIVED_SSS_SCT_SSS_TERM_LINK'), page.waitForNavigation()])
    }
    return results
  } catch (e) {
    throw e
  }
}

/**
 * Async Entrypoint
 */
async function main () {
  try {
    const browser = await puppeteer.launch({ devtools: true })
    const page = await browser.newPage()
    await login(page, config.username, config.password)
    const gradePages = await getGrades(page)
    console.log(JSON.stringify(gradePages, null, '\t'))
    await browser.close()
  } catch (e) {
    console.error(e)
  }
}

main()
