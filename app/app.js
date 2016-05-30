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
  // 4秒間に1回クライアントにプッシュ通知。
  // クライアントは通知を受け取ったらその数字をそのまま返す。
  // サーバーサイドで受け取った数字が送ったものと一緒なら繋がっているとする。
  // 4秒間返答がなかったら、接続が切れたとする
  // connection = setInterval(function() {
  //   for(var key in _this.serverUsers) {
  //     userCount -= 1
  //     _this.broadcast.emit('user left', {
  //       handle: users[key].handle,
  //       handleColor: users[key].handleColor,
  //       userCount: userCount
  //     })
  //     delete users[key]
  //   }
  //   _this.serverUsers = _this.users
  //   _this.serverState += 1
  //   _this.emit('connected?', { state: _this.serverState })
  // }, 4000)

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

// メッセージを解析
function analytics(data, broadcast, me, all) {
  const h = data.handle
  const m = data.message
  const command = m.split(' ')

  if(command[0].toLowerCase() == 'bot' || command[0].toLowerCase() == botName.toLowerCase()) {
    const order = botReply(command)
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
    return
  } else {
    // 非同期で学習する

    broadcast('new message', {
      handle: h,
      handleColor: users[h].handleColor,
      message: m
    })
    return   
  }
}

function botReply(command) {
  if(!(command[0] == 'bot' || command[0] == botName.toLowerCase())) return {}
  
  const com = command[1].toLowerCase()
  const data = command[2]
  console.log('com is ' + com)
  console.log('data is ' + data)

  if(com == 'ping') return ['me', { data: 'pong' }]

  if(com == 'help') {
    const message = API.botHelp(data)
    return ['me', { data: message }, 'bot style reply']
  }

  if(com == 'todo') {
    console.log(1)
    const message = API.todo(data, command[3], command.slice(4))
    console.log(4)
    return ['me', { data: message }, 'bot style reply']
  }

  if(com == 'timer') {
    const message = API.setTimer(data)
    const count = Number(data)
    return ['all', { data: message, count: count }, 'bot timer']
  }

  if(com == 'youtube') {
    const message = API.youtube(data)
    return ['all', { data: message }, 'bot style reply']
  }

  if(com == 'news') {
    const message = API.news()
    return ['all', { data: message }, 'bot simple reply']
  }

  if(com == 'set') {
    if(!data) {
      return ['me', { data: 'コマンドが不適切です。bot help参照' }, 'room message']
    }
    const regxp = /^(\w+)=(\w+)$/i
    const config = data.match(regxp)
    if(config[1] == 'botname') {
      botName = config[2]
      const message = 'ボットネームを' + botName + 'に変更しました。'
      return ['all', { data: message }, 'room message']
    } else if(config[1] == 'color') {
      this.handleColor = config[2]
      users[this.handle] = { handle: this.handle, handleColor: this.handleColor }
      const message = 'あなたの色を' + config[2] + 'に変更しました。'
      return ['me', { data: message }, 'room message']
    }
  }
  
  if(com == 'map') {
    const staticImage = API.googleStaticMap(data)
    return ['all', { data: data + 'の地図です。',image: staticImage }]
  }

  return ['me', { data: 'コマンドが不適切です。bot help参照' }, 'room message']
}

app.io.route('yeah', function (next, data) {
  console.log(data.state + ' is ' + this.serverState + '  for ' + data.handle)
  if(data.state == this.serverState) {
    delete this.serverUsers[data.handle]
    console.log(data.handle + ' is connected')
  } else {
    if(this.joined) {
      userCount -= 1
      delete users[this.handle]
      this.broadcast.emit('user left', {
        handle: this.handle,
        handleColor: this.handleColor,
        userCount: userCount
      })
      this.joined = false
    }
  }
})