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
        },
        /**
         * Sends a message to a list of embedded iframes.
         * @param {Object} msg The message to send.
         * @param {Array} ids of destination frames.
         */
        sendMsg: function(msg, ids){
            if(Array.isArray(ids)){
                var len = ids.length;
                for (var i = 0; i < len; i++) {
                    var iframe = document.getElementById(ids[i]);
                    if(iframe != null && iframe.tagName === 'IFRAME'){
                        iframe.contentWindow.postMessage(msg, '*');
                    }
                }
            }
        }
    };
});
