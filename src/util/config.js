import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

function noop () {}

/**
 * getConfig - Read `config.json` for config if it exists
 *
 * @async
 * @export
 * @returns config object
 */
export async function getConfig () {
  return JSON.parse(
    (await promisify(fs.readFile)(path.resolve(__dirname, '../../config.json')).catch(noop)) || {}
  )
}
