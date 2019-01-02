import cheerio from 'cheerio'

export function parseStudentProgramInfo (html) {
  let result = {}
  const $ = cheerio.load(html)
  $('tr').each((i, elem) => {
    const key = $(elem).children('td').first().text().trim().toLowerCase().replace(/\W+/g, '_')
    const value = $(elem).children('td').last().text().trim()
    result[key] = value
  })
  return result
}
