/**
 * A module to query the EEXCESS federated recommender and cache results
 * @module c4/APIconnector
 */

/**
 * Callback used by query
 * @callback APIconnector~onResponse
 * @param {String} status Indicates the status of the request, either "success" or "error". 
 * @param {Object} data Contains the response data. In the case of an error, it is the error message and in the case of success, it is the response returned from the federated recommender in the format described at {@link https://github.com/EEXCESS/eexcess/wiki/json-exchange-format#response-format}. The profile that lead to this response is included in an additional attribute "profile".
 */


define(['jquery'], function($) {
    var settings = {
        base_url: 'http://eexcess-dev.joanneum.at/eexcess-privacy-proxy-1.0-SNAPSHOT/api/v1/',
        favicon_url: 'http://eexcess-dev.joanneum.at/eexcess-federated-recommender-web-service-1.0-SNAPSHOT/recommender/getPartnerFavIcon?partnerId=',
        timeout: 10000,
        cacheSize: 10,
        suffix_recommend: 'recommend',
        suffix_details: 'getDetails'
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
        /**
         * Initializes the module with parameters other than the defaults.
         * @param {Object} config The configuration to be set. Only the parameters to change need to be specified.
         * @param {String} config.url The url of the endpoint.
         * @param {Integer} config.timeout The timeout of the request in ms.
         * @param {Integer} config.cacheSize The size of the cache.
         */
        init: function(config) {
            settings = $.extend(settings, config);
        },
        /**
         * Function to query the federated recommender.
         * @param {Object} profile The profile used to query. The format is described at {@link https://github.com/EEXCESS/eexcess/wiki/json-exchange-format#request-format}
         * @param {APIconnector~onResponse} callback Callback function called on success or error. 
         */
        query: function(profile, callback) {
            if (xhr && xhr.readyState !== 4) {
                xhr.abort();
            }
            xhr = $.ajax({
                url: settings.base_url + settings.suffix_recommend,
                data: JSON.stringify(profile),
                type: 'POST',
                contentType: 'application/json; charset=UTF-8',
                dataType: 'json',
                timeout: settings.timeout
            });
            xhr.done(function(response) {
                console.log(response);
                response['profile'] = profile;
                response['faviconURL'] = settings.favicon_url;
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
        /**
         * Function to retriev details for a set of returned results.
         * @param {Array} documentBadges The set of documentbadges for which details should be retrieved. There exists a documentbagde for each result entry in the original result set.
         * @param {APIconnector~onResponse} callback Callback function called on success or error. 
         */
        getDetails: function(documentBadges, callback) {
            var xhr = $.ajax({
                url: settings.base_url + settings.suffix_details,
                data: JSON.stringify({documentBadge:documentBadges}),
                type: 'POST',
                contentType: 'application/json; charset=UTF-8',
                dataType: 'json',
                timeout: settings.timeout
            });
            xhr.done(function(response) {
                callback({status:'success', data:response});
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
        /**
         * Function to retrieve the contents of the cache.
         * @returns {Array} The cache.
         */
        getCache: function() {
            return sessionCache;
        },
        /**
         * Function to retrieve the last query and results.
         * @returns {Object|null} The query/result-pair or null, if no request has been sent yet.
         */
        getCurrent: function() {
            if (sessionCache.length > 0) {
                return sessionCache[sessionCache.length - 1];
            } else {
                return null;
            }
        }
    };
});