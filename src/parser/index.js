import cheerio from 'cheerio'

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
