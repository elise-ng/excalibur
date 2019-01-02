import puppeteer from 'puppeteer'
import config from '../config.json'

const URL_SIS_LOGIN = 'https://sisprod.psft.ust.hk/psp/SISPROD/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL?pslnkid=Z_HC_SSS_STUDENT_CENTER_LNK&FolderPath=PORTAL_ROOT_OBJECT.Z_HC_SSS_STUDENT_CENTER_LNK&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder'
const URL_SIS_HOMEPAGE_FRAME = 'https://sisprod.psft.ust.hk/psc/SISPROD/EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL?pslnkid=Z_HC_SSS_STUDENT_CENTER_LNK&FolderPath=PORTAL_ROOT_OBJECT.Z_HC_SSS_STUDENT_CENTER_LNK&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder&PortalActualURL=https%3a%2f%2fsisprod.psft.ust.hk%2fpsc%2fSISPROD%2fEMPLOYEE%2fHRMS%2fc%2fSA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL%3fpslnkid%3dZ_HC_SSS_STUDENT_CENTER_LNK&PortalContentURL=https%3a%2f%2fsisprod.psft.ust.hk%2fpsc%2fSISPROD%2fEMPLOYEE%2fHRMS%2fc%2fSA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL%3fpslnkid%3dZ_HC_SSS_STUDENT_CENTER_LNK&PortalContentProvider=HRMS&PortalCRefLabel=Student%20Center&PortalRegistryName=EMPLOYEE&PortalServletURI=https%3a%2f%2fsisprod.psft.ust.hk%2fpsp%2fSISPROD%2f&PortalURI=https%3a%2f%2fsisprod.psft.ust.hk%2fpsc%2fSISPROD%2f&PortalHostNode=HRMS&NoCrumbs=yes'
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
    const response = await Promise.race([page.waitForResponse(URL_SIS_HOMEPAGE_FRAME, { timeout: TIMEOUT_2FA }), page.waitForResponse(res => res.status() === 401)])
    if (response.status() === 401) { throw new Error('401 Unauthorized') }
    return page
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
    const result = await login(page, config.username, config.password)
    console.log(await result.content())
    await browser.close()
  } catch (e) {
    console.error(e)
  }
}

main()
