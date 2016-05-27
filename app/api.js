const co = require('co')


let COMMANDS = {
  ping: { description: 'return pong', usage: 'bot ping' },
  map: { description: 'return static image', usage: 'bot map [location]'}
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
  var message = '<div class="timer__container"><div class="timer" data-seconds-left=' + second +'></div></div>'
  return message
}




