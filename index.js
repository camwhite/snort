const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

const { argv } = require('yargs')
const { spawn } = require('child_process')
const { parser } = require('stream-json')
const { streamArray } = require('stream-json/streamers/StreamArray')

const date = new Date().toISOString()
const opts = [
  `-a duration:${parseInt(argv.d)}`,
  //`-w captures/${date}.pcap`,
  //'-Y eapol || http.request and http.request.method !== SSD',
  //'-f "ether proto 0x888e or port 80 and tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x47455420"',
  //`-o ssl.keylog_file:$PWD/sslkeylogs/premaster.txt`,
  //'-o ssl.debug_file:debug.txt',
  //'-Y ssl',
  `-Px`,
  `-Y websocket`,
  `-Y http`,
  `-T json`,
  //`-e ssl.handshake.random`,
  //`-e ssl.handshake.session_id`,
  //`-e ssl.handshake.ciphersuite`,
  //`-e ssl.handshake.epms`,
  `-e ip.src`,
  `-e http.host`,
  `-e http.request.full_uri`,
  `-e http.user_agent`,
  `-e http.cookie`,
  `-e http.file_data`,
  //`-e frame.time`,
  //`-e tcp.stream`,
  `-e http.request.method`,
  `-e http.request.uri`,
  `-e http.content_type`,
  `-e http.response.code`,
  `-e websocket.payload`
]

if (argv.k) {
  opts.unshift(`-o "ssl.keylog_file: ${argv.k}"`)
}
if (argv.monitor) {
  opts.push(`-Ini ${argv.i}`)
  if (argv.s && argv.p) {
    opts.unshift(`-o 'uat:80211_keys:\"wpa-pwd\",\"${argv.p}:${argv.s}\"'`)
  }
} else {
  opts.unshift(`-i ${argv.i}`)
}

const captures = []
const capture = spawn('tshark', opts, {
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
    fs.writeFileSync(`captures/${date}.json`, JSON.stringify(captures))
  })

capture.stderr.on('data', (err) => console.log(chalk.red(err.toString())))

const parseSource = (data) => {
  const parsedSource = {}
  const { layers } = data._source
  Object.keys(layers).forEach(key => {
    const suffix = key.split('.').pop()
    parsedSource[suffix] = layers[key][0]
  })
  if (parsedSource.file_data && parsedSource.content_type === 'application/json; charset=utf-8') {
    parsedSource.file_data.replace('\\', '')
    parsedSource.file_data = JSON.parse(parsedSource.file_data)
  }
  return parsedSource
}
