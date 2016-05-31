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
  var notice_on = false

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
      $('.mainArea__handle--input').val('')
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
    const message = $chatInput.val().replace(/^\s*(.*?)\s*$/, "$1") //前後の空白を消去
    console.log(message)
    if( message && connected ) {
      $chatInput.val('').end()
      $chatInput.selectionStart = 0
      $chatInput.selectionEnd = 0
      $chatInput.focus()
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

  function sendFlashMessage(message) {
    socket.emit('flash message', {
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

    if(notice_on) {
      chatNotice()
    } else {
      $('.mainArea__top--timeline').animate( {
        scrollTop: $('.timeline__list')[0].scrollHeight
      })
    }
  }

  // チャットの通知を下に表示する
  function chatNotice() {
    $('.chat_notice').show()
    setTimeout(function() {
      $('.chat_notice').hide()
    }, 1000)
  }

  // ユーザのメッセージを表示
  function addChatMessage(data, options) {
    const message = marked( e(data.message.replace(/[\n\r]/g, '<br />')) )
    const $handleDiv = $('<dt class="timeline__item--handle" />').text(data.handle).css('color', data.handleColor)
    const $msgBodyDiv = $('<dd class="timeline__item--message" />').html(message)

    const $msgDiv = $('<li class="timeline__list--item" />')
      .data('handle', data.handle)
      .append( $('<dl />').append($handleDiv, $msgBodyDiv) )
    addMessageToTimeline($msgDiv, options)
  }

  // エスケープ
  function e(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');  
  }

  // flashメッセージ追加
  function flashMessage(message, type) {
    var html = '<button type="button" class="close" data-dismiss="alert">&times;</button>'
    html += message
    const $msg = $('<div>').addClass('alert alert-dismissible alert-' + type).html(html)
    $('.mainArea__info').append($msg)
    setTimeout(function() {
      $msg.fadeOut(1000)
    }, 3000)
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
    $('.user__list').html('')
    for(var key in users) {
      addUserList(users[key].handle, users[key].handleColor)
    }
  }
  // ルーム参加者を追加する
  function addUserList(handle, handleColor) {
    const $user = $('<li class="user__list--item">').attr('data-handle', handle)
      .html('<span style="color:' + handleColor + '">' + handle + '</span>')
    $users.append($user)
  }
  // ルーム参加者から減らす
  function removeUserList(handle) {
    $('.user__list--item[data-handle="' + handle + '"]').fadeOut()
  }


  // キーボード入力検知
  $(window).on('keydown', function(e) {
    // Enterキーで入力可能に
    if(e.keyCode == 13) {
      if(handleColor) {
        if(e.shiftKey) {

        } else {
          sendMessage()
        }
      } else {
        setHandle()
      }
    }
  })

  $('.disconnect').on('click', function(e) {
    socket.emit('left', {
      handle: handle 
    })
    e.preventDefault()
  })

  $('.notice-on').on('click', function(e) {
    var $i = $(this).find('i')
    if($i.hasClass('on')) {
      $i.removeClass()
      $i.addClass('glyphicon glyphicon-sort-by-attributes off')
      notice_on = false
    } else {
      $i.removeClass()
      $i.addClass('glyphicon glyphicon-volume-up on')
      notice_on = true
    }
    e.preventDefault()
  })

  $(window).on('onbeforeunload', function(e) {
    socket.emit('left', {
      handle: handle 
    })
    return 'チャットから離脱しますがよろしいですか。'
  })

  // ログイン
  socket.on('joined', function(data) {
    connected = true
    const message = '<p>Chattyへようこそ, ' + data.handle + 'さん。</p>'
    flashMessage(message, 'success')
    const $you = $('<li />')
      .html('<a class="#"><span style="color:' + data.handleColor + ';-webkit-text-stroke:1px black;">' + data.handle + '</span></a>')
    $('.your--handle').append($you)
    initUserList(data.users)
    addMembersMessage(data);
  })

  // ユーザ参加通知
  socket.on('user joined', function(data) {
    const message = '<span style="color:' + data.handleColor + '";-webkit-text-stroke:1px black;>' + data.handle + '</span>が参加しました。'
    addUserList(data.handle, data.handleColor)
    flashMessage(message, 'success')
    addMembersMessage(data)
  })

  // ユーザ離席通知
  socket.on('user left', function(data) {
    const message = '<span style="color:' + data.handleColor + '";-webkit-text-stroke:1px black;>' + data.handle + '</span>が離席しました。'
    console.log(message)
    removeUserList(data.handle)
    flashMessage(message, 'warning')
  })

  // 自分が離席した
  socket.on('left', function(data) {
    handleColor = undefined
    const message = '<span style="color:' + data.handleColor + ';-webkit-text-stroke:1px black;">あなた</span>が離席しました。'
    $('.your--handle').html('')
    removeUserList(data.handle)
    flashMessage(message, 'success')
    $dimmed.fadeIn()
    $('.mainArea__handle').fadeIn()
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

  // フラッシュメッセージ
  socket.on('flash message', function(data) {
    flashMessage(data.data, 'warning')
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
    const message = data.data
    const hash = data.hash
    const $handleDiv = $('<dt class="timeline__item--handle" />').text(data.botName)
    const $msgBodyDiv = $('<dd class="timeline__item--message" />').html(message)
    const $msgDiv = $('<li class="timeline__list--item" />')
      .append( $('<dl />').append($handleDiv, $msgBodyDiv) )
    botMessage($msgDiv)

    var clock = $('.clock.' + hash).FlipClock(Number(data.count), {
      clockFace: 'Counter',
      autoStart: true,
      countdown: true,
      callbacks: {
        stop: function() {
          sendFlashMessage('タイマーが終了しました。', 'danger')
          $('.clock.' + hash).remove()
        }
      }
    })
  })

  // サーバーからの問いかけ。
  socket.on('connected?', function(data) {
    if(data) {
      socket.emit('yeah', { state: data.state, handle: handle })
    }
  })

});
