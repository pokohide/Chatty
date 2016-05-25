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

  const $timeline = $('.timeline__list')
  const $chatInput = $('.mainArea__form--input')
  var handle, handleColor

  var connected = false

  var lastTypingTime;
  var typing = false

  const socket = io()
  var $dimmed = $('.mainArea__dimmed')

  // ハンドルネームを設定
  $('.mainArea__handle--submit').on('click', function(e) {
    setHandle()
    e.preventDefault()  
  })

  // チャットする
  $('.mainArea__handle--submit').on('click', function(e) {

    e.preventDefault()
  })


  // ハンドルネームを設定
  function setHandle() {
    handle = $('.mainArea__handle--input').val()
    if(handle) {
      $dimmed.fadeOut()
      $('.mainArea__handle').fadeOut()
      $('.mainArea__form--input').focus()
      socket.emit('user join', handle)
      const index = Math.floor( Math.random() * COLORS.length )
      handleColor = COLORS[index]
    }
  }

  // メッセージをタイムラインに追加
  function addMessageToTimeline($msg, options) {
    console.log(1)
    if(!options) options = {}
    if(typeof options.fade == 'undefined') options.fade = true
    if(typeof options.prepend == 'undefined') options.prepend = true
    console.log(2)
    if(options.fade) {
      $msg.hide().fadeIn(FADE_TIME)
    }
    if(options.prepend) {
      $timeline.prepend($msg)
    } else {
      $timeline.append($msg)
    }
    console.log(3)
    //$timeline[0].scrollTop = $timeline[0].scrollHeight
  }

  // ユーザのメッセージを表示
  function addChatMessage(data, options) {
    //   var $typingMessages = getTypingMessages(data);
    //   options = options || {};
    //   if ($typingMessages.length !== 0) {
    //     options.fade = false;
    //     $typingMessages.remove();
    //   }
    const $handleDiv = $('<span class="timeline__item--handle" />').text(data.handle).css('color', handleColor)
    const $msgBodyDiv = $('<span class="timeline__item--message" />').text(data.message)

    //const typingClass = data.typing ? 'typing' : ''
    const $msgDiv = $('<li class="timeline__list--item" />')
      .data('handle', data.handle)
      //.addClass(typingClass)
      .append($handleDiv, $msgBodyDiv)
    addMessageToTimeline($msgDiv, options)
  }

  // メッセージを送る
  function sendMessage() {
    const message = $chatInput.val()
    if( message && connected ) {
      $chatInput.val('')
      addChatMessage({
        handle: handle,
        message: message
      })
      socket.emit('new message', message)
    }
  }

  // roomメッセージ追加
  function roomMessage(message, options) {
    const $msg = $('<li>').addClass('roomMessage').text(message)
    addMessageToTimeline($msg, options)
  }

  // botメッセージ追加
  function botMessage(message, options) {
    const $msg = $('<li>').addClass('botMessage').text(message)
    addMessageToTimeline($msg, options)
  }

  // Chattyの人数を表示
  function addMembersMessage(data) {
    const message = 'このチャットルームの参加者は' + data.userCount + '人です。'
    roomMessage(message)
  }


  // チャット入力中
  $chatInput.on('input', function() {
    // nowTyping()
  })


  // キーボード入力検知
  $(window).on('keydown', function(e) {
    // Enterキーで入力可能に
    if(e.keyCode == 13) {
      if(handle) {
        sendMessage()
        // socket.emit('stop typing')
        // typing = false
      } else {
        setHandle()
      }
    }
  })


  // ログイン
  socket.on('joined', function(data) {
    console.log('joined')
    connected = true
    const message = 'Chattyへようこそ'
    roomMessage(message, {prepend: true})
    addMembersMessage(data);
  })

  // 新しいメッセージ
  socket.on('new message', function(data) {
    addChatMessage(data)
  })

  // ユーザ参加通知
  socket.on('user joined', function(data) {
    roomMessage(data.handle + 'が参加しました。')
    addMembersMessage(data)
  })

  // ユーザ離席通知
  socket.on('user left', function(data) {
    roomMessage(data.handle + 'が離席しました。')
    addMembersMessage(data)
    // removeChatTyping(data)
  })

  socket.on('typing', function(data) {
    console.log('now typing')
    // addChatTyping(data)
  })

  socket.on('stop typing', function(data) {
    console.log('remove typing')
    // removeChatTyping(data)
  })

});



  // Adds the visual chat typing message
  // function addChatTyping (data) {
  //   data.typing = true;
  //   data.message = 'is typing';
  //   addChatMessage(data);
  // }

  // // Removes the visual chat typing message
  // function removeChatTyping (data) {
  //   getTypingMessages(data).fadeOut(function () {
  //     $(this).remove();
  //   });
  // }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)


  // // Prevents input from having injected markup
  // function cleanInput (input) {
  //   return $('<div/>').text(input).text();
  // }

  // // Updates the typing event
  // function updateTyping () {
  //   if (connected) {
  //     if (!typing) {
  //       typing = true;
  //       socket.emit('typing');
  //     }
  //     lastTypingTime = (new Date()).getTime();

  //     setTimeout(function () {
  //       var typingTimer = (new Date()).getTime();
  //       var timeDiff = typingTimer - lastTypingTime;
  //       if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
  //         socket.emit('stop typing');
  //         typing = false;
  //       }
  //     }, TYPING_TIMER_LENGTH);
  //   }
  // }

  // Gets the 'X is typing' messages of a user
  // function getTypingMessages (data) {
  //   return $('.typing.message').filter(function (i) {
  //     return $(this).data('username') === data.username;
  //   });
  // }



