angular.module("angular-growl").service("growlMessages", ['$sce', '$timeout', function ($sce, $timeout) {
  "use strict";

  var messages;
  var referenceId;

  this.init = function(reference, limitMessages, onlyUnique, reverseOrder) {
    this.messages = messages = [];
    this.limitMessages = limitMessages;
    this.onlyUnique = onlyUnique;
    this.reverseOrder = reverseOrder;
    referenceId = reference || 0;

  };

  this.addMessage = function(message) {
    if (parseInt(referenceId, 10) === parseInt(message.referenceId, 10)) {
      var found;
      var msgText;

      if (this.onlyUnique) {
        angular.forEach(messages, function(msg) {
          msgText = $sce.getTrustedHtml(msg.text);
          if (message.text === msgText &&
                message.severity === msg.severity &&
                  msg.title === msg.title) {
            found = true;
          }
        });

        if (found) {
          return;
        }
      }

      message.text = $sce.trustAsHtml(String(message.text));

      /**If message closes on timeout, add's promises array for
        timeouts to stop close. Also sets message.closeoutTimer to ttl / 1000
      **/
      if(message.ttl && message.ttl !== -1) {
        message.countdown = message.ttl / 1000;
        message.promises = [];
        message.close = false;
        message.countdownFunction = function() {
          if(message.countdown > 1){
            message.countdown--;
            message.promises.push($timeout(message.countdownFunction, 1000));
          } else {
            message.countdown--;
          }
        };
      }

      /** Limit the amount of messages in the container **/
      if (angular.isDefined(this.limitMessages)) {
        var diff = messages.length - (this.limitMessages - 1);
        if (diff > 0) {
          messages.splice(this.limitMessages - 1, diff);
        }
      }

      /** abillity to reverse order (newest first ) **/
      if (this.reverseOrder) {
        messages.unshift(message);
      } else {
        messages.push(message);
      }

      if(typeof(message.onopen) === 'function') {
        message.onopen();
      }

      if (message.ttl && message.ttl !== -1) {
        //adds message timeout to promises and starts messages countdown function.
        message.promises.push($timeout(angular.bind(this, function() {
          this.deleteMessage(message);
        }, message.ttl)));
        message.promises.push($timeout(message.countdownFunction, 1000));
      }

      return message;
    }
  };

  this.deleteMessage = function(message) {
    var index = messages.indexOf(message);
    if (index > -1) {
      messages.splice(index, 1);
    }

    if(typeof(message.onclose) === 'function') {
      message.onclose();
    }
  };
}]);
