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
  if(!this.joined) {
    delete users[this.handle]
    userCount -= 1
    this.broadcast.emit('user left', {
      handle: this.handle,
      handleColor: this.handleColor,
      userCount: userCount
    })
  }
})

// ユーザの参加を検知
app.io.route('user join', function* (next, data) {
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
})

app.io.route('disconnect', function* (next, data) {
  console.log('disconnect')
})

// when the client emits 'new message', this listens and executes
app.io.route('new message', function* (next, data) {
  // we tell the client to execute 'new message'
  console.log(data)
  const _this = this

  analytics(data, function(type, reply) {
    console.log('type is ' + type)
    console.log('reply is' + reply)
    _this.broadcast.emit(type, reply);
  })
  // this.broadcast.emit('new message', {
  //   handle: data.handle,
  //   handleColor: users[data.handle].handleColor,
  //   message: data.message
  // });
});

// when the client emits 'typing', we broadcast it to others
app.io.route('typing', function* () {
  console.log('%s is typing', this.username);
  this.broadcast.emit('typing', {
    username: this.username
  });
});

// when the client emits 'stop typing', we broadcast it to others
app.io.route('stop typing', function* () {
  console.log('%s is stop typing', this.username);
  this.broadcast.emit('stop typing', {
    username: this.username
  });
});


// メッセージを解析
function analytics(data, fn) {
  const h = data.handle
  const m = data.message
  const command = m.split(' ')

  if(command[0] == 'bot' || command[0] == botName) {
    var reply = botReply(command)
    reply['botName'] = (botName == null ? 'bot' : botName + '(bot)')
    fn('bot reply', reply)
    return
  } else {
    // 非同期で学習する

    fn('new message', {
      handle: h,
      handleColor: users[h].handleColor,
      message: m
    })
    return   
  }
}

function botReply(command) {
  if(!(command[0] == 'bot' || command[0] == botName)) return {}
  
  const com = command[1]
  const data = command[2]
  console.log('com is ' + com)
  console.log('data is ' + data)

  if(com == 'ping') return { data: 'pong' }
  
  if(com == 'map') {
    const staticImage = API.googleStaticMap(data)
    return { data: data + 'の地図です。',image: staticImage }
  }

}

