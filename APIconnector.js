define(['jquery'], function($) {
    var settings = {
        url: 'http://eexcess-dev.joanneum.at/eexcess-privacy-proxy-1.0-SNAPSHOT/api/v1/recommend',
        timeout: 10000,
        cacheSize: 10
    };
    var xhr;
    var sessionCache = [];
    var addToCache = function(element) {
        if (sessionCache.length === settings.cacheSize) {
            sessionCache.shift();
        }
        sessionCache.push(element);
    };

    return {
        init: function(config) {
            settings = $.extend(settings, config);
        },
        query: function(profile, callback) {
            if (xhr && xhr.readyState !== 4) {
                xhr.abort();
            }
            xhr = $.ajax({
                url: settings.url,
                data: JSON.stringify(profile),
                type: 'POST',
                contentType: 'application/json; charset=UTF-8',
                dataType: 'json',
                timeout: settings.timeout
            });
            xhr.done(function(response) {
                console.log(response);
                response['profile'] = profile;
                addToCache(response);
                if (typeof callback !== 'undefined') {
                    callback({status: 'success', data: response});
                }
            });
            xhr.fail(function(jqXHR, textStatus, errorThrown) {
                if (textStatus !== 'abort') {
                    console.log(jqXHR);
                    console.log(textStatus);
                    console.log(errorThrown);
                    if (typeof callback !== 'undefined') {
                        callback({status: 'error', data: textStatus});
                    }
                }
            });
        },
        getCache: function() {
            return sessionCache;
        },
        getCurrent: function() {
            if(sessionCache.length > 0) {
                return sessionCache[sessionCache.length-1];
            } else {
                return null;
            }
        }
    };
});