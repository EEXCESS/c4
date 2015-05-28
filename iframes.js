define(function() {
    return {
        sendMsgAll: function(msg) {
            var iframes = document.getElementsByTagName('iframe');
            for (var i = 0; i < iframes.length; i++) {
                iframes[i].contentWindow.postMessage(msg, '*');
            }
        }
    };
});