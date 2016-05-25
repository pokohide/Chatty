'use srtict';

const koa = require('koa')
const _ = require('koa-route');
const views = require('co-views');
const serve = require('koa-static');
const moment = require('moment');
const fs = require('fs');
const app = koa();

let port = 8080;

// ユーザページ
const usernames = {};
const userCount = 0;

// static file serve
app.use(serve(__dirname + '/'));


// ルート
app.use(_.get('/', room));
// app.use(_.get('/user_join', user_join));
// app.use(_.get('/user_left', user_left));
// app.use(_.get('/chat/:message', chat));
// app.use(_.get('/typing', typing));
// app.use(_.get('/cancel_typing', cancel_typing));


/* ソケット定義 */
const server = require('http').Server(app.callback())
const io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {
  socket.on('message', function(message) {
    io.sockets.emit('new message', {
        message: message,
        posted_at: moment().format('YYYY/MM/DD HH:mm:ss')
    })
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

/* ユーザが参加 */
// function *user_join(next, username) {
//   this.username = username;
//   usernames[username] = username;
//   userCount += 1;
//   this.exist_user = true;
//   this.emit('参加しました。login', {
//     userCount: userCount
//   })

//   this.broadcast.emit('ユーザが参加しました', {
//     username: this.username,
//     userCount: userCount
//   })
// }

// /* ユーザが離席 */
// function *user_left() {
//   console.log('somebody disconnected');
//   console.log(this.headers);
//   yield* next;

//   if (this.addedUser) {
//     delete usernames[this.username];
//     userCount -= 1;

//     // 抜けたことを通知
//     this.broadcast.emit('ユーザが退出しました', {
//         username: this.username,
//         userCount: userCount
//     })
//   }
// }

// /* ユーザの投稿 */
// function *chat(next, message) {
//   console.log(message);

//   this.broadcast.emit('新規メッセージ', {
//     username: this.username,
//     message: message
//   })
// }

// /* 文字入力中 */
// function *typing() {
//   console.log('%s is typing', this.username);
//   this.broadcast.emit('typing', {
//     username: this.username
//   })
// }

// /* 文字入力終了 */
// function *cancel_typing() {
//   console.log('%s is stop typing', this.username);
//   this.broadcast.emit('stop typing', {
//     username: this.username
//   });
// }
