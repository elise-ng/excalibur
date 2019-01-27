import cheerio from 'cheerio'
import moment from 'moment'
import _ from 'lodash'

function cleanKey (string) {
  return string.trim().toLowerCase().replace(/\W+/g, '_')
}

/**
 * SIS Grade Page Parser
 * @param {string} html html string of grade page
 * @returns {object}
 */
export function parseGrades (html) {
  let result = {}
  const $ = cheerio.load(html)
  // Semester Title
  result['semester'] = $('.SSSPAGEKEYTEXT').text().split('|')[0].trim()
  // course table
  let grades = []
  let headers = []
  $('table[class="PSLEVEL1GRID"] tbody tr').each((i, elem) => {
    if (i === 0) { // header row
      headers = $(elem).children().map((i, elem) => cleanKey($(elem).text()))
    } else {
      let course = {}
      $(elem).children('td').each((i, elem) => {
        course[headers[i]] = $(elem).text().trim()
      })
      grades.push(course)
    }
  })
  result['grades'] = grades
  // stats table
  // grade points row
  $('table[class="PSLEVEL1GRIDWBO"] tbody tr').eq(-2).children('td').each((i, elem) => {
    if (i === 1) { // TGA
      result['term_grade_points'] = $(elem).text().trim()
    } else if (i === 3) { // CGA
      result['cumulative_grade_points'] = $(elem).text().trim()
    }
  })
  // units row
  $('table[class="PSLEVEL1GRIDWBO"] tbody tr').eq(-2).children('td').each((i, elem) => {
    if (i === 1) { // TGA
      result['term_units'] = $(elem).text().trim()
    } else if (i === 3) { // CGA
      result['cumulative_units'] = $(elem).text().trim()
    }
  })
  // gpa row
  $('table[class="PSLEVEL1GRIDWBO"] tbody tr').eq(-1).children('td').each((i, elem) => {
    if (i === 1) { // TGA
      result['tga'] = $(elem).text().trim()
    } else if (i === 3) { // CGA
      result['cga'] = $(elem).text().trim()
    }
  })
  return result
}

/**
 * Student Program Info Page Parser
 * @param {string} html html string of info page
 * @returns {object}
 */
export function parseStudentProgramInfo (html) {
  let result = {}
  const $ = cheerio.load(html)
  $('tr').each((i, elem) => {
    const key = cleanKey($(elem).children('td').first().text())
    const value = $(elem).children('td').last().text().trim()
    result[key] = value
  })
  return result
}

/**
 * SIS Class Schedule Page Parser
 * @param {string} html html string of info page
 * @returns {object}
 */
export function parseClassSchedule (html) {
  let result = {}
  const $ = cheerio.load(html)
  result['semester'] = $('.SSSPAGEKEYTEXT').text().split('|')[0].trim()
  // course boxes
  let courses = []
  $('.PSGROUPBOXWBO').each((i, elem) => {
    if (i === 0) { return } // skip filter option box
    let course = {}
    let titleParts = $(elem).find('.PAGROUPDIVIDER').text().split(' - ')
    course['code'] = titleParts[0]
    course['title'] = titleParts[1]
    course['classes'] = []
    $(elem).find('.PSLEVEL3GRIDNBO').each((i, elem) => { // inner tables
      let headers = $(elem).find('.PSLEVEL3GRIDCOLUMNHDR').map((i, elem) => cleanKey($(elem).text())) // header cells
      let rows = []
      let row = {}
      $(elem).find('.PSLEVEL3GRIDROW').each((i, elem) => { // data cells
        row[headers[i % headers.length]] = $(elem).text().trim()
        if (i % headers.length === headers.length - 1) { // separate rows by num of col
          rows.push(row)
          row = {}
        }
      })
      if (i === 0) { // course info
        course = { ...course, ...rows[0] }
      } else {
        course['classes'] = rows
      }
    })
    // class info further parsing
    course['classes'] = course['classes'].map((class_) => {
      // e.g. 30/01/2019 - 09/05/2019
      let dates = class_['start_end_date'].split(' - ')
      if (dates.length === 2) {
        class_['start_date'] = moment(dates[0], 'DD/MM/YYYY').utcOffset(8, true).toISOString(true)
        class_['end_date'] = moment(dates[1], 'DD/MM/YYYY').utcOffset(8, true).toISOString(true)
        delete class_['start_end_date']
      }
      // e.g. WeFr 3:00PM - 4:20PM
      let repeatTime = class_['days_times'].split(' ')
      if (repeatTime.length === 4) {
        class_['weekdays'] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].filter(weekday => repeatTime[0].includes(weekday.substr(0, 1)))
        class_['start_time'] = moment(repeatTime[1], 'h:mma').utcOffset(8, true).toISOString(true)
        class_['end_time'] = moment(repeatTime[3], 'h:mma').utcOffset(8, true).toISOString(true)
        delete class_['days_times']
      }
      // multiple instructors
      class_['instructor'] = class_['instructor'].replace(', \n', '; ')
      // remove empty values
      class_ = _(class_).omitBy(_.isEmpty).omitBy(_.isNil).value()
      return class_
    })
    // remove empty values
    course = _(course).omitBy(_.isEmpty).omitBy(_.isNil).value()
    courses.push(course)
  })
  result['courses'] = courses
  return result
}
