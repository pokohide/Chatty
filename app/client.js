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
  const $users = $('.user__list')
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
  $('.mainArea__form--submit').on('click', function(e) {
    sendMessage()
    e.preventDefault()
  })


  // ハンドルネームを設定
  function setHandle() {
    handle = $('.mainArea__handle--input').val()
    if(handle) {
      if(handle.length > 10) {
        alert('ハンドルネームは10文字以下で設定してください')
        return
      }
      $dimmed.fadeOut()
      $('.mainArea__handle').fadeOut()
      $('.mainArea__form--input').focus()
      const index = Math.floor( Math.random() * COLORS.length )
      handleColor = COLORS[index]
      socket.emit('user join', {
        handle: handle,
        handleColor: handleColor
      })
    }
  }

  // メッセージを送る
  function sendMessage() {
    var message = $chatInput.val()
    message = $('.mainArea__form--input').val()
    if( message && connected ) {
      $chatInput.val('')
      // 自分のタイムラインにメッセージを表示
      addChatMessage({
        handle: handle,
        handleColor: handleColor,
        message: message
      })
      socket.emit('new message', {
        handle: handle,
        message: message
      })
    }
  }

  // 全体にルームメッセージを送信
  function sendRoomMessage(message) {
    socket.emit('room message', {
      message: message
    })
  }


  /////////////////////////////////////////////
  //*********  メッセージを表示 ***************//
  /////////////////////////////////////////////

  // メッセージをタイムラインに追加
  function addMessageToTimeline($msg, options) {
    if(!options) options = {}
    if(typeof options.fade != 'undefined') options.fade = true
    if(typeof options.prepend != 'undefined') options.prepend = true
    if(options.fade) {
      $msg.hide().fadeIn(FADE_TIME)
    }
    if(options.prepend) {
      $timeline.prepend($msg)
    } else {
      $timeline.append($msg)
    }
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
    const $handleDiv = $('<dt class="timeline__item--handle" />').text(data.handle).css('color', data.handleColor)
    const $msgBodyDiv = $('<dd class="timeline__item--message" />').text(data.message)

    //const typingClass = data.typing ? 'typing' : ''
    const $msgDiv = $('<li class="timeline__list--item" />')
      .data('handle', data.handle)
      //.addClass(typingClass)
      .append( $('<dl />').append($handleDiv, $msgBodyDiv) )
    addMessageToTimeline($msgDiv, options)
  }


  // roomメッセージ追加
  function roomMessage(message, options) {
    const $msg = $('<li>').addClass('roomMessage').html(message)
    addMessageToTimeline($msg, options)
  }

  // botメッセージ追加
  function botMessage($msg, options) {
    $msg.addClass('botMessage')
    addMessageToTimeline($msg, options)
  }

  // Chattyの人数を表示/リストに追加
  function addMembersMessage(data) {
    const message = 'このチャットルームの参加者は現在' + data.userCount + '人です。'
    roomMessage(message)
  }



  /////////////////////////////////////////////
  //*************  ルーム参加者 ***************//
  /////////////////////////////////////////////

  // ルーム参加者を初期設定
  function initUserList(users) {
    for(var key in users) {
      addUserList(users[key].handle, users[key].handleColor)
    }
  }
  // ルーム参加者を追加する
  function addUserList(handle, handleColor) {
    const $user = $('<li class="user__list--item">').data('handle', handle)
      .html('<span style="color:' + handleColor + '">' + handle + '</span>')
    $users.append($user)
  }
  // ルーム参加者から減らす
  function removeUserList(handle) {
    $('.users__list--item[data-handle="' + handle + '"]').fadeOut()
  }


  // チャット入力中
  $chatInput.on('input', function() {
    // nowTyping()
  })


  // キーボード入力検知
  $(window).on('keydown', function(e) {
    // Enterキーで入力可能に
    if(e.keyCode == 13) {
      if(handleColor) {
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
    connected = true
    const message = 'Chattyへようこそ, ' + data.handle + 'さん。'
    const $you = $('<li />')
      .html('<a class="#"><span style="color:' + data.handleColor + '">' + data.handle + '</span></a>')
    $('.your--handle').append($you)
    initUserList(data.users)
    roomMessage(message, {prepend: true})
    addMembersMessage(data);
  })

  // ユーザ参加通知
  socket.on('user joined', function(data) {
    const message = '<span style="color:' + data.handleColor + '">' + data.handle + '</span>が参加しました。'
    addUserList(data.handle, data.handleColor)
    roomMessage(message)
    addMembersMessage(data)
  })

  // ユーザ離席通知
  socket.on('user left', function(data) {
    const message = '<span style="color:' + data.handleColor + '">' + data.handle + '</span>が離席しました。'
    console.log(message)
    removeUserList(data.handle)
    roomMessage(message)
    addMembersMessage(data)
    // removeChatTyping(data)
  })

  // 新しいメッセージ
  socket.on('new message', function(data) {
    console.log(data)
    addChatMessage(data)
  })

  // ルームメッセージ
  socket.on('room message', function(data) {
    roomMessage(data.data)
  })

  // ボットからの返信(シンプルなもの)
  socket.on('bot simple reply', function(data) {
    var message = ''
    if(data.data) {
      message += '<p>' + data.data + '</p>'
    }
    if(data.image) {
      message += '<img src="' + data.image + '">'
    }
    const $handleDiv = $('<dt class="timeline__item--handle" />').text(data.botName)
    const $msgBodyDiv = $('<dd class="timeline__item--message" />').html(message)
    const $msgDiv = $('<li class="timeline__list--item" />')
      .append( $('<dl />').append($handleDiv, $msgBodyDiv) )
    botMessage($msgDiv)
  })

  // ボットからの返信(styleを持ったもの)
  socket.on('bot style reply', function(data) {
    const message = data.data
    const $handleDiv = $('<dt class="timeline__item--handle" />').text(data.botName)
    const $msgBodyDiv = $('<dd class="timeline__item--message" />').html(message)
    const $msgDiv = $('<li class="timeline__list--item" />')
      .append( $('<dl />').append($handleDiv, $msgBodyDiv) )
    botMessage($msgDiv)
  })

  // タイマーの設置
  socket.on('bot timer', function(data) {
    const message = data.data;
    const $handleDiv = $('<dt class="timeline__item--handle" />').text(data.botName)
    const $msgBodyDiv = $('<dd class="timeline__item--message" />').html(message)
    const $msgDiv = $('<li class="timeline__list--item" />')
      .append( $('<dl />').append($handleDiv, $msgBodyDiv) )
    botMessage($msgDiv)

    var clock = $('.clock').FlipClock(Number(data.count), {
      clockFace: 'Counter',
      autoStart: true,
      countdown: true,
      callbacks: {
        stop: function() {
          sendRoomMessage('タイマーが終了しました。')
          $('.clock').remove()
        }
      }
    })
    console.log('ok')
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



