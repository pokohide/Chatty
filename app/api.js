const co = require('co')
const http = require('http')


let COMMANDS = {
  ping: { description: 'return pong', usage: 'bot ping' },
  map: { description: 'return static image', usage: 'bot map [location]'},
  timer: { description: 'set timer on this board', usage: 'bot timer [second]'},
  youtube: { description: 'set youtube on this board', usage: 'bot youtube [link]'}
}

module.exports.googleStaticMap = function(center) {
  const zoom = 16
  const size = '640x400'
  const maptype = 'roadmap'

  var path = 'https://maps.googleapis.com/maps/api/staticmap?center=' + center + '&zoom=' + zoom + '&size=' + size
  path += '&maptype=' + maptype + '&path=weight%3A5|color%3A0x0000ff|enc%3A{bbzFfyvwMnFwP&style=feature%3Aroad|element%3Aall|hue%3A0x00ff00'
  return path
}

module.exports.botHelp = function(data) {
  var message = '' 
  if(!data || data == '') {
  	message += '<dl>Usage: bot [command] [arguments]<br>'
  	for(var key in COMMANDS) {
  	  message += '<dt>' + key + '</dt><dd>' + COMMANDS[key].description + '</dd>'
  	}
  	message += "concept guides. See 'bot help [command]'</dl>"
  	return message
  }

  if(COMMANDS[data]) {
  	message += 'Usage:  ' + COMMANDS[data].usage + '<br>'
  	message += '<dt>' + data + '</dt><dd>' + COMMANDS[data].description + '</dd>'
  	return message
  }
}

module.exports.setTimer = function(data) {
  const second = data || 60
  var message = '<div class="clock" style="margin:2em;"></div>'
  return message
}

module.exports.youtube = function(data) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/
  const match = data.match(regExp)
  const videoId = match[7]
  return '<iframe src="//www.youtube.com/embed/' + videoId + '?controls=0&modestbranding=1" width="560" height="315" frameborder="0" allowfullscreen></iframe>'
}

module.exports.news = function() {
  const newsUrl = 'http://news.google.com/news?hl=ja&ned=us&ie=UTF-8&oe=UTF-8&output=rss&topic=po'
  const url = 'https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&q=' + newsUrl + '&num=5'
  console.log(url)
  http.get(url, (res) => {
  	let body = ''
  	res.setEncoding('utf8')
  	res.on('data', (chunk) => {
  	  body += chunk
  	})
  	res.on('end', (res) => {
  	  return JSON.parse(body)
  	})
  }).on('error', (e) => {
  	return e.message
  })
}




