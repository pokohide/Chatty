'use strict';

var ws = new WebSocket('ws://localhost:3000/');

$(function () {
  $('form').submit(function(){
    var $this = $(this);
    // ws.onopen = function() {
    //   console.log('sent message: %s', $('#m').val());
    // };
    ws.send($('#m').val());
    $('#m').val('');
    return false;
  });
  ws.onmessage = function(msg){
    var returnObject = JSON.parse(msg.data);
    $('#messages').append($('<li>')).append($('<span id="clientId">').text(returnObject.id)).append($('<span id="clientMessage">').text(returnObject.data));
  };
  ws.onerror = function(err){
    console.log("err", err);
  };
  ws.onclose = function close() {
    console.log('disconnected');
  };


  var wsUri = "ws://localhost:9999/echo";
  var output;

  function init() {
    output = document.getElementById('messages');
    testWebSocket();
  }

  function testWebSocket() {
    ws = new WebSocket(wsUri);
    ws.onopen = function(e) {
      console.log('opened');
    }
    ws.onclode = function(e) {
      console.log('closed');
    }
    ws.onmessage = function(e) {
      console.log('aaa');
    }
    ws.onerror = function(e) {
      console.log('error');
    }
    window.addEventListener("load", init, false);

  }

});

