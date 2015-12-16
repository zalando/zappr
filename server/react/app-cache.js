import fs from 'fs'

const APP_CACHE_FILE = 'dist/client/zappr.appcache'

export function getAssets() {
  return new Promise((resolve, reject) => {
    fs.readFile(APP_CACHE_FILE, (err, data) => {
      if (err) return reject(err)

      const manifest = data.toString()
      const js = manifest.match(/^.*\.js$/gm) || []
      const css = manifest.match(/^.*\.css$/gm) || []

      resolve({js, css})
    })
  })
}
