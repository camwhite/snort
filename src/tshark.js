const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

const { argv } = require('yargs')
const { spawn } = require('child_process')
const { parser } = require('stream-json')
const { streamArray } = require('stream-json/streamers/StreamArray')

const args = [
  `-a duration:${parseInt(argv.d)}`,
  `-Px`,
  `-Y websocket`,
  `-Y http`,
  `-T json`,
  `-e ip.src`,
  `-e http.host`,
  `-e http.request.full_uri`,
  `-e http.user_agent`,
  `-e http.cookie`,
  `-e http.file_data`,
  `-e http.request.method`,
  `-e http.request.uri`,
  `-e http.content_type`,
  `-e http.response.code`,
  `-e websocket.payload`
]

const { k, i, s, p, monitor } = argv

if (k) {
  args.push(`-o "ssl.keylog_file: ${k}"`)
}
if (monitor) {
  args.unshift(`-I -i ${i}`)
  if (s && p) {
    args.unshift(`-o 'uat:80211_keys:\"wpa-pwd\",\"${p}:${s}\"'`)
  }
} else {
  args.unshift(`-i ${i}`)
}

const captures = []
const capture = spawn('tshark', args, {
  shell: true,
  cwd: __dirname
})
capture.stdout
  .pipe(parser())
  .pipe(streamArray())
  .on('data', (data) => {
    const parsed = parseSource(data.value)
    captures.push(parsed)
    console.dir(parsed, {
      depth: null,
      colors: true
    })
  })
  .on('end', () => {
    const date = new Date().toISOString()
    fs.writeFileSync(`captures/${date}.json`, JSON.stringify(captures))
  })

capture.stderr.on('data', (err) => console.log(chalk.red(err.toString())))

const parseSource = (data) => {
  const parsedSource = {}
  const { layers } = data._source
  Object.keys(layers).forEach((key) => {
    const suffix = key.split('.').pop()
    parsedSource[suffix] = layers[key][0]
  })
  if (parsedSource.file_data && parsedSource.content_type === 'application/json; charset=utf-8') {
    parsedSource.file_data.replace('\\', '')
    parsedSource.file_data = JSON.parse(parsedSource.file_data)
  }
  return parsedSource
}

module.exports = capture

