'use srtict';

const koa = require('koa.io');
const _ = require('koa-route');
const co = require('co');
const views = require('co-views');
const serve = require('koa-static');
const moment = require('moment');
const fs = require('fs');
const app = koa();

let API = require('./api.js');
let port = process.env.PORT || 8080;

// ユーザページ
var users = {}
var userCount = 0
var botName = 'Chatty'
var connection
var chatbot = {}

// Chatbot初期化
API.initMarkov(function(bot) {
  chatbot = bot
})


// 300秒ごとにバックアップ
setInterval(function() {
  API.saveMarkov(chatbot)
}, 300000)
 
// 静的ページ
app.use(serve(__dirname + '/'));
app.use(function*() {
  this.body = fs.createReadStream(path.join(__dirname, 'index.html'));
  this.type = 'html';
});

// サーバー起動
app.listen(port, function() {
  console.log('Server listening at port %d', port);
});



// 通信の連携
app.io.route(function* (next) {
  // 繋がった処理
  console.log('connected')
  yield* next;
  // 途切れた処理
  console.log('disconnect')
})

// ユーザの参加を検知
app.io.route('user join', function (next, data) {
  this.handle = data.handle
  this.handleColor = data.handleColor
  users[this.handle] = { handle: this.handle, handleColor: this.handleColor }
  userCount += 1
  this.joined = true
  this.emit('joined', {
    users: users,
    handle: this.handle,
    handleColor: this.handleColor,
    userCount: userCount
  })
  this.broadcast.emit('user joined', {
    handle: this.handle,
    handleColor: this.handleColor,
    userCount: userCount
  })

  const _this = this
  this.serverState = 0
  this.serverUsers = this.users
})

app.io.route('left', function (next, data) {
  console.log(data)
  if(this.joined) {
    userCount -= 1
    delete users[this.handle]
    this.broadcast.emit('user left', {
      handle: this.handle,
      handleColor: this.handleColor,
      userCount: userCount
    })
    this.emit('left', {
      handle: this.handle,
      handleColor: this.handleColor,
      userCount: userCount
    })
    this.joined = false
  }
})

// new messageを検知
app.io.route('new message', function (next, data) {
  console.log(data)
  const _this = this

  analytics(data, function(type, reply) {
    console.log('for user except you, type is ' + type + ', reply is' + JSON.stringify(reply))
    _this.broadcast.emit(type, reply);
  }, function(type, reply) {
    console.log('for you, type is ' + type + ', reply is ' + JSON.stringify(reply))
    _this.emit(type, reply);
  }, function(type, reply) {
    console.log('for all user, type is ' + type + ', reply is ' + JSON.stringify(reply))
    _this.broadcast.emit(type, reply);
    _this.emit(type, reply);
  })
});

// 全体にroom Messageを通知
app.io.route('room message', function (next, data) {
  this.broadcast.emit('room message', { data: data.message })
  //this.emit('room message', { data: data.message })
})

// 全体にflash messageを通知
app.io.route('flash message', function (next, data) {
  this.broadcast.emit('flash message', { data: data.message })
  //this.emit('flash message', { data: data.message })
})

// メッセージを解析
function analytics(data, broadcast, me, all) {
  const h = data.handle
  const m = data.message
  const command = m.split(' ')

  if(command[0].toLowerCase() == 'bot' || command[0].toLowerCase() == botName.toLowerCase()) {
    botReply(command, function(order) {
      const destination = order[0] // 送信先
      var reply = order[1]
      const type = order[2] || 'bot simple reply'
      reply['botName'] = (botName == null ? 'bot' : botName + '(bot)')
      if(destination == 'broadcast') {
        broadcast(type, reply)
      } else if(order[0] == 'me') {
        me(type, reply)
      } else if(order[0] == 'all') {
        all(type, reply)
      }
    })
    return
  } else {
    // 非同期で学習する
    API.analysis(m, function(words) {
      for(var i=0; i < words.length-1; i++) {
        const first = words[i].surface
        const next = words[i+1].surface
        if( chatbot[first] ) {
          chatbot[first].push(next)
        } else {
          chatbot[first] = [next]
        }
      }
      console.log(chatbot)
    })

    broadcast('new message', {
      handle: h,
      handleColor: users[h].handleColor,
      message: m
    })
    return   
  }
}

function botReply(command, emit) {
  if(!(command[0] == 'bot' || command[0] == botName.toLowerCase())) emit({})
  
  const com = command[1].toLowerCase()
  const data = command[2]
  console.log('com is ' + com)
  console.log('data is ' + data)

  if(com == 'ping') emit( ['me', { data: 'pong' }] )

  else if(com == 'help') {
    API.botHelp(data, function(message) {
      emit( ['me', { data: message }, 'bot style reply'] )
    })
  }

  else if(com == 'todo') {
    API.todo(data, command[3], command.slice(4), function(message) {
      emit( ['me', { data: message }, 'bot style reply'] )
    })
  }

  else if(com == 'timer') {
    API.setTimer(data, function(message, hash) {
      const count = Number(data)
      emit( ['all', { data: message, count: count, hash: hash }, 'bot timer'] )
    })
    const count = Number(data)
  }

  else if(com == 'youtube') {
    API.youtube(data, function(message) {
      emit( ['all', { data: message }, 'bot style reply'] )
    })
  }

  else if(com == 'talk') {
    // 学習してから返信を考える
    API.analysis(command.slice(2).join(' '), function(words) {
      var word = ''
      for(var i=0; i < words.length-1; i++) {
        const first = words[i].surface
        const next = words[i+1].surface
        if(words[i].pos == '名詞') word = words[i].surface
        if( chatbot[first] ) {
          chatbot[first].push(next)
        } else {
          chatbot[first] = [next]
        }
        if(word.length == 0) word = words[Math.floor(Math.random() * words.length)].surface
      }
      API.talk(word, chatbot, function(message) {
        emit( ['me', { data: message }, 'bot style reply'] )
      })
    })
  }

  else if(com == 'news') {
    console.log('ok')
    API.news(data, function(message) {
      emit( ['all', { data: message }, 'bot style reply'] )
    })
  }

  else if(com == 'status') {
    API.status(botName, chatbot, function(message) {
      emit( ['me', {data: message }, 'bot simple reply'] )
    })
  }

  else if(com == 'set') {
    if(!data) {
      return ['me', { data: 'コマンドが不適切です。bot help参照' }, 'room message']
    }
    const regxp = /^(\w+)=(\w+)$/i
    const config = data.match(regxp)
    if(config[1] == 'botname') {
      botName = config[2]
      const message = 'ボットネームを' + botName + 'に変更しました。'
      emit( ['all', { data: message }, 'room message'] )
    } else if(config[1] == 'color') {
      this.handleColor = config[2]
      users[this.handle] = { handle: this.handle, handleColor: this.handleColor }
      const message = 'あなたの色を' + config[2] + 'に変更しました。'
      emit( ['me', { data: message }, 'room message'] )
    }
  }
  
  else if(com == 'map') {
    API.googleStaticMap(data, function(image) {
      emit( ['all', { data: data + 'の地図です。',image: image }] )
    })
  }

  else { emit( ['me', { data: 'コマンドが不適切です。bot help参照' }, 'room message'] ) }
}