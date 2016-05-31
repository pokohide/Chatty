const co = require('co')
const http = require('http')
const request = require('request')
const querystring = require('querystring')
const parser = require('libxml-to-js')
const xml2json = require('xml2json')
const marked = require('marked')
const mongoose = require('mongoose')
const API = require('./api')


const TodoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  body: { type: String, required: true },
  completed: { type: Boolean, default: false }
})
const Todo = mongoose.model('Todo', TodoSchema)


const MarkovScheme = new mongoose.Schema({
  name: String,
  vocabulary: String
})
const Markov = mongoose.model('Markov', MarkovScheme)


mongoose.connect(process.env.MONGOLAB_URI, function (error) {
  if (error) console.error(error);
  else console.log('mongo connected');
});

let COMMANDS = {
  map: { description: 'return static image', usage: ['bot map [location]'] },
  news: { description: 'return 3 news', usage: ['bot news [options]',
  'options: y(社会), w(国際), b(ビジネス), p(政治), e(エンタメ), s(スポーツ), t(テクノロジー), po(話題)'] },
  ping: { description: 'return pong', usage: ['bot ping'] },
  set: { description: 'set botname or set your color', usage: ['bot set botname=[botname]', 'bot set color=[#rgb]'] },
  status: { description: 'show bot status', usage: ['bot status'] },
  talk: { description: 'you can talk with bot', usage: ['bot talk [トーク内容]'] },
  timer: { description: 'embed timer on this board', usage: ['bot timer [second]'] },
  todo: { description: 'you can use todo list', usage: ['bot todo add [todo名] [todo内容]', 'bot todo delete [todo名]', 'bot todo list'] },
  youtube: { description: 'embed youtube on this board', usage: ['bot youtube [link]'] }
}

module.exports.todo = function(command, name, body, fn) {
  if(command == 'add') {
    if(name.length==0 || body.length==0) fn('<p><code>bot todo add [todo名] [todo内容]</code> の形式で入力してください。</p>')
    var todo = new Todo({ name: name, body: body.join(' ') });
    todo.save(function(err) {
   	  if(err) fn('<p>Todoを追加できませんでした。</p>')
    })
    fn('<p>Todoリストに  Todo名: <b>' + name + '</b>, Todo内容: <b>' + body + '</b> を追加しました。</p>')
  }


  else if(command == 'delete' && name == 'all') {
    Todo.remove({}, function(err) {
      if(err) fn('<p>Todoを消去できませんでした。</p>')
    })
    fn('<p>Todoリストを全て消去しました。</p>')
  }


  else if(command == 'delete') {
    if(name.length==0) fn('<p><code>bot todo delete [todo名]</code> の形式で入力してください。</p>')
  	Todo.remove({ name: name }, function(err) {
  	  if(err) fn('<p>Todoを消去できませんでした。</p>')
  	})
    fn('<p>Todoリストの  Todo名: <b>' + name + '</b> を消去しました。</p>')
  }


  else if(command == 'list') {
  	Todo.find({}, function(err, docs) {
  	  if(!err) {
        if(docs.length == 0) {
          fn('<p>Todoリストは空です。</p>')
        } else {
          var message = '現在のTodoリスト一覧です。 [Todo名]:  [Todo内容]'
          for(var i=0; i < docs.length; i++) {
            message += marked('* <b>' + docs[i].name + '</b>:  <b>' + docs[i].body + '</b>')
          }
          fn(marked(message))
        }
  	  } else {
  	  	fn('<p>Todoリストを参照できません。</p>')
  	  }
  	})
  }

  else { fn('<p><code>bot help todo</code>を参照してください。</p>') }
}

module.exports.googleStaticMap = function(center, fn) {
  const zoom = 16
  const size = '640x400'
  const maptype = 'roadmap'

  var path = 'https://maps.googleapis.com/maps/api/staticmap?center=' + center + '&zoom=' + zoom + '&size=' + size
  path += '&maptype=' + maptype + '&path=weight%3A5|color%3A0x0000ff|enc%3A{bbzFfyvwMnFwP&style=feature%3Aroad|element%3Aall|hue%3A0x00ff00'
  fn(path)
}

module.exports.botHelp = function(data, fn) {
  var message = '' 
  if(!data || data == '') {
  	message += '<dl>Usage: bot [commands] [arguments]<br>'
  	message += 'Commands:<br>'
  	for(var key in COMMANDS) {
  	  message += '<div style="padding-left:20px"><dt>' + key + '</dt><dd>' + COMMANDS[key].description + '</dd></div>'
  	}
  	message += "Config into can be viewed via: bot help [commands]</dl>"
  	fn(message)
  }

  else if(COMMANDS[data]) {
  	message += '<dt>' + data + '</dt><dd>' + COMMANDS[data].description + '</dd>'
  	message += '<b>Usage:</b><br>'
  	for(var i=0; i < COMMANDS[data].usage.length; i++) {
  	  message += marked('* ' + '`' + COMMANDS[data].usage[i] + '`')
  	}
  	fn(message)
  }

}

module.exports.setTimer = function(data, fn) {
  const second = data || 60
  const hash = Math.random().toString(36).slice(-8)
  var message = '<div class="clock ' + hash + '" style="margin:2em;"></div>'
  fn(message, hash)
}

module.exports.youtube = function(data, fn) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/
  const match = data.match(regExp)
  const videoId = match[7]
  fn('<iframe src="//www.youtube.com/embed/' + videoId + '?controls=0&modestbranding=1" width="560" height="315" frameborder="0" allowfullscreen></iframe>')
}

module.exports.news = function(data, fn) {
  // ir=ピックアップ, y=社会, w=国際, b=ビジネス, p=政治, e=エンタメ, s=スポーツ, t=テクノロジー, po=話題
  var topic
  if(['y', 'w', 'b', 'p', 'e', 's', 't', 'po'].indexOf(data) >= 0) {
    topic = data
  } else {
    topic = 'po'
  }
  const url = 'https://news.google.com/news?hl=ja&ned=us&ie=UTF-8&oe=UTF-8&output=rss&num=3&topic=' + topic

  request(url, function(err, response, body) {
    if(!err && response.statusCode == 200) {
      const json = JSON.parse( xml2json.toJson(body) )
      const news = json.rss.channel.item
      console.log(news)

      if(news.length > 0) {
        var message = ''
        for(var i=0; i<news.length; i++) {
          message += '<a href="' + news[i].link + '" target="_blank">' + news[i].title + '</a><br>'
          message += news[i].description + '<br>'
        }
        fn(message)
      } else {
        fn('<p>Newsが取得できませんでした。</p>')
      }
    } else {
      fn('<p>Newsが取得できませんでした。</p>')
    }
  })
}

module.exports.status = function(name, bot, fn) {
  const bytes = unescape(encodeURIComponent(JSON.stringify(bot))).length
  const vocabulary = Object.keys(bot).length

  var message = '僕の名前は' + name + '(o＾ω＾o)<br>みんなの会話を勉強してる！'
  message += '僕はイマ**' + bytes + '**バイトだよ。<br>'
  message += 'ちなみに僕のイマの語彙数は**' + vocabulary + '**だよ。<br>'
  message += '僕と話すには`bot talk [会話内容]`で返事をするよ！'

  fn(marked(message)) 
}

module.exports.dice = function(data, fn) {
  const max = data || 6
  const message = 'サイコロを振った結果は' + (Math.floor( Math.random() * max)+1) + 'です。'
  fn(message)
}


module.exports.talk = function(first, bot, fn) {
  var message = first
  var count = 0
  while(bot[first] && count<20) {
    const arr = bot[first]
    const next = arr[Math.floor(Math.random() * arr.length)]
    message += next
    first = next
    count += 1
  }
  fn(message)
}

module.exports.analysis = function(data, fn) {
  const qst = querystring.stringify({
    appid: process.env.YAHOO_APPID,
    sentence: data,
    results: 'ma'
  })

  const options = {
    host: 'jlp.yahooapis.jp',
    port: 80,
    path: '/MAService/V1/parse?' + qst
  };

  http.get(options, function(res) {
    res.setEncoding('utf8')
    var result = ''
    res.on('data', function(chunk) {
      result += chunk
    })
    res.on('end', function() {
      const json = JSON.parse( xml2json.toJson(result) )
      const words = json.ResultSet.ma_result.word_list.word
      fn(words)   
    })
  })
}

module.exports.initMarkov = function(fn) {
  Markov.findOne({ name: 'chatbot' }, function(err, obj) {
    if(!err) {
      if(obj) {
        fn( JSON.parse(obj.vocabulary) )
      } else {
        fn( {} )
      }
    } else {
      fn( {} )
    }
  })
}


module.exports.saveMarkov = function(bot) {
  Markov.findOne({ bane: 'chatbot' }, function(err, obj) {
    if(obj) {
      obj.vocabulary = JSON.stringify(bot)
      obj.save()
    } else {
      var chatbot = new Markov({ name: 'chatbot', vocabulary: JSON.stringify(bot) })
      chatbot.save(function(err) {
        console.log(err)
      })
    }
  })
}



