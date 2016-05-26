'use srtict';

const koa = require('koa.io')
const _ = require('koa-route');
const views = require('co-views');
const serve = require('koa-static');
const moment = require('moment');
const fs = require('fs');
const app = koa();

let port = process.env.PORT || 8080;

// ユーザページ
var users = {}
var userCount = 0

// static file serve
app.use(serve(__dirname + '/'));


// 通信の連携
app.io.route(function* connection(next) {
  // 繋がった処理
  yield* next
  // 途切れた処理
  if(this.joined) {
    delete users[handle]
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

// when the client emits 'new message', this listens and executes
app.io.route('new message', function* (next, data) {
  // we tell the client to execute 'new message'
  console.log(data)
  this.broadcast.emit('new message', {
    handle: data.handle,
    handleColor: users[data.handle].handleColor,
    message: data.message
  });
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



// サーバー起動
app.listen(port, function() {
  console.log('Server listening at port %d', port);
});

/* トップページ */
function *room() {
  this.body = fs.createReadStream(path.join(__dirname, 'index.html'));
  this.type = 'html';
}
