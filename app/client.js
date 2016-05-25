'use strict';

$(function() {
  let FADE_TIME = 150
  let TYPING_TIMER_LENGTH = 400
  let COLORS = [
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
    '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
    '#f1c40f', '#e67e22', '#e74c3c', '#f39c12', '#d35400', 
    '#c0392b', '#bdc3c7', '#7f8c8d'
  ]

  const $window = $(window)
  const $timeline = $('.timeline__list')
  const $chatForm = $('.m')

  const $loginPage = $('.login__page')
  const $chatPage = $('.chat__page')

  var lastTypingTime;
  var connected = false
  ,   typing = false

  const socket = io()
  var $dimmed = $('.mainArea__dimmed')
  //$('body').append($dimmed)

  // ハンドルネームを設定
  $('.mainArea__handle--submit').on('click', function(e) {
    const handle = $('.mainArea__handle--input').val()
    console.log(handle)
    if( handle ) {
      $dimmed.fadeOut()
      $('.mainArea__handle').fadeOut()
      socket.emit('add user', handle)
    }
    e.preventDefault()  
  })

  function addMembersMessage(data) {
    const message = ''
    if( Number(data.userCount) == 1) {
      message += 'このチャットルームの参加者は一人です。'
    } else {
      message += 'このチャットルームの参加者は' + data.userCount + '人です。'
    }
    log(message)
  }


});



// 'use strict';

// var ws = new WebSocket('ws://localhost:3000/');

// $(function () {
//   $('form').submit(function(){
//     var $this = $(this);
//     // ws.onopen = function() {
//     //   console.log('sent message: %s', $('#m').val());
//     // };
//     ws.send($('#m').val());
//     $('#m').val('');
//     return false;
//   });
//   ws.onmessage = function(msg){
//     var returnObject = JSON.parse(msg.data);
//     $('#messages').append($('<li>')).append($('<span id="clientId">').text(returnObject.id)).append($('<span id="clientMessage">').text(returnObject.data));
//   };
//   ws.onerror = function(err){
//     console.log("err", err);
//   };
//   ws.onclose = function close() {
//     console.log('disconnected');
//   };


//   var wsUri = "ws://localhost:9999/echo";
//   var output;

//   function init() {
//     output = document.getElementById('messages');
//     testWebSocket();
//   }

//   function testWebSocket() {
//     ws = new WebSocket(wsUri);
//     ws.onopen = function(e) {
//       console.log('opened');
//     }
//     ws.onclode = function(e) {
//       console.log('closed');
//     }
//     ws.onmessage = function(e) {
//       console.log('aaa');
//     }
//     ws.onerror = function(e) {
//       console.log('error');
//     }
//     window.addEventListener("load", init, false);

//   }
// });



