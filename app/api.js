const co = require('co')
const http = require('http')
const marked = require('marked')
const mongoose = require('mongoose')

const TodoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  body: { type: String, required: true },
  completed: { type: Boolean, default: false }
})
const Todo = mongoose.model('Todo', TodoSchema)

mongoose.connect(process.env.MONGOLAB_URI, function (error) {
  if (error) console.error(error);
  else console.log('mongo connected');
});

let COMMANDS = {
  ping: { description: 'return pong', usage: ['bot ping'] },
  map: { description: 'return static image', usage: ['bot map [location]'] },
  timer: { description: 'embed timer on this board', usage: ['bot timer [second]'] },
  youtube: { description: 'embed youtube on this board', usage: ['bot youtube [link]'] },
  set: { description: 'set botname or set your color', usage: ['bot set botname=[botname]', 'bot set color=[#rgb]'] },
  todo: { description: 'you can use todo list', usage: ['bot todo add [todo名] [todo内容]', 'bot todo delete [todo名]', 'bot todo list'] }
}

module.exports.todo = function(command, name, body, fn) {
  if(command == 'add') {
    if(name.length==0 || body.length==0) return '<p><code>bot todo add [todo名] [todo内容]</code> の形式で入力してください。</p>'
    var todo = new Todo({ name: name, body: body.join(' ') });
    todo.save(function(err) {
   	  if(err) return '<p>Todoを追加できませんでした。</p>'
    })
    return '<p>Todoリストに  Todo名: <b>' + name + '</b>, Todo内容: <b>' + body + '</b> を追加しました。</p>'
  }


  else if(command == 'delete' && name == 'all') {
    Todo.remove({}, function(err) {
      if(err) return '<p>Todoを消去できませんでした。</p>'
    })
    return '<p>Todoリストを全て消去しました。</p>'
  }


  else if(command == 'delete') {
    if(name.length==0) return '<p><code>bot todo delete [todo名]</code> の形式で入力してください。</p>'
  	Todo.remove({ name: name }, function(err) {
  	  if(err) return '<p>Todoを消去できませんでした。</p>'
  	})
    return '<p>Todoリストの  Todo名: <b>' + name + '</b> を消去しました。</p>'
  }


  else if(command == 'list') {
    console.log(2)
  	Todo.find({}, function(err, docs) {
  	  if(!err) {
        if(docs.length == 0) {
          return '<p>Todoリストは空です。</p>'
        } else {
          var message = ''
          for(var i=0; i < docs.length; i++) {
            console.log(docs[i].name)
            console.log(docs[i].body)
            message += '* <b>' + docs[i].name + '</b>:  <b>' + docs[i].body + '</b>'
          }
          //message = marked(message)
          console.log(message)
          console.log(3)
          return message
        }
  	  } else {
  	  	return '<p>Todoリストを参照できません。</p>'
  	  }
  	})
  }

  else { return '<p><code>bot help todo</code>を参照してください。</p>' }
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
  	message += '<dl>Usage: bot [commands] [arguments]<br>'
  	message += 'Commands:<br>'
  	for(var key in COMMANDS) {
  	  message += '<div style="padding-left:20px"><dt>' + key + '</dt><dd>' + COMMANDS[key].description + '</dd></div>'
  	}
  	message += "Config into can be viewed via: bot help [commands]</dl>"
  	return message
  }

  else if(COMMANDS[data]) {
  	message += '<dt>' + data + '</dt><dd>' + COMMANDS[data].description + '</dd>'
  	message += '<b>Usage:</b><br>'
  	for(var i=0; i < COMMANDS[data].usage.length; i++) {
  	  message += marked('* ' + '`' + COMMANDS[data].usage[i] + '`')
  	}
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




