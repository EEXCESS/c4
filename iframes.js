/**
 * A utility module for communication with iframes
 * 
 * @module c4/iframes
 */

define(function() {
    return {
        /**
         * Sends a message to all iframes embedded in the current window.
         * @param {Object} msg The message to send.
         */
        sendMsgAll: function(msg) {
            var iframes = document.getElementsByTagName('iframe');
            for (var i = 0; i < iframes.length; i++) {
                iframes[i].contentWindow.postMessage(msg, '*');
            }
        }
    };
});