/**
 * A module to query the EEXCESS privacy proxy and cache results
 * @module c4/APIconnector
 */

/**
 * Callback used by query
 * @callback APIconnector~onResponse
 * @param {String} status Indicates the status of the request, either "success" or "error". 
 * @param {Object} data Contains the response data. In the case of an error, it is the error message and in the case of success, it is the response returned from the federated recommender in the format described at {@link https://github.com/EEXCESS/eexcess/wiki/%5B21.09.2015%5D-Request-and-Response-format#response-format}. The profile that lead to this response is included in an additional attribute "profile".
 */
define(["jquery", "peas/peas_indist"], function($, peas_indist) {
    var settings = {
        base_url: "https://eexcess.joanneum.at/eexcess-privacy-proxy-issuer-1.0-SNAPSHOT/issuer/",
        timeout: 10000,
        logTimeout: 5000,
        loggingLevel: 0,
        cacheSize: 10,
        suffix_recommend: 'recommend',
        suffix_details: 'getDetails',
        suffix_favicon: 'getPartnerFavIcon?partnerId=',
        suffix_log: 'log/',
        suffix_getRegisteredPartners: 'getRegisteredPartners',
        numResults: 80
    };
    peas_indist.init(settings.base_url);
    var xhr;
    var sessionCache = [];
    var addToCache = function(element) {
        if (sessionCache.length === settings.cacheSize) {
            sessionCache.shift();
        }
        sessionCache.push(element);
    };

    var originException = function(errorMsg) {
        this.toString = function() {
            return errorMsg;
        };
    }
    /**
     * Complement the origin object with the name of the client and a user identifier;
     * 
     * @param {Object} origin The origin to complement
     * @returns {Object} The complemented origin
     */
    var complementOrigin = function(origin) {
        if (typeof origin === 'undefined') {
            throw new originException("origin undefined");
        } else if (typeof origin.module === 'undefined') {
            throw new originException("origin.module undfined");
        } else if (typeof settings.origin === 'undefined') {
            throw new originException('origin undefined (need to initialize via APIconnector.init({origin:{clientType:"<name of client>", clientVersion:"version nr",userID:"<UUID>"}})');
        } else if (typeof settings.origin.clientType === 'undefined') {
            throw new originException('origin.clientType undefined (need to initialize via APIconnector.init({origin:{clientType:"<name of client>"}})');
        } else if (typeof settings.origin.clientVersion === 'undefined') {
            throw new originException('origin.clientVersion undefined (need to initialize via APIconnector.init({origin:{clientVersion:"<version nr>"}})');
        } else if (typeof settings.origin.userID === 'undefined') {
            throw new originException('origin.userID undefined (need to initialize via APIconnector.init({origin:{userID:"<UUID>"}})');
        } else {
            origin.clientType = settings.origin.clientType;
            origin.clientVersion = settings.origin.clientVersion;
            origin.userID = settings.origin.userID;
        }
        return origin;
    };

    return {
        /**
         * Initializes the module with parameters other than the defaults.
         * @param {Object} config The configuration to be set. Only the parameters to change need to be specified.
         * @param {String} config.base_url The url of the endpoint.
         * @param {Integer} config.timeout The timeout of the query request in ms.
         * @param {Integer} config.logTimeout The timeout for logging requests in ms.
         * @param {Integer} config.loggingLevel Flag indicating whether request should be logged on the privacy proxy or not (0 := enabled, 1 := disabled)
         * @param {Integer} config.cacheSize The number of queries/responses to cache.
         * @param {String} config.suffix_recommend The query endpoint.
         * @param {String} config.suffix_details The endpoint for gathering details about response items.
         * @param {String} config.suffix_favicon The endpoint for gathering the favicon of a provider.
         * @param {String} cnfig.suffix_log The endpoint for logging.
         * @param {Object} config.origin The origin object for logging.
         */
        init: function(config) {
            settings = $.extend(settings, config);
        },
        /**
         * Set the number of results to retrieve from the federated recommender
         * @param {Number} numResults The number of results
         */
        setNumResults: function(numResults) {
            settings.numResults = numResults;
        },
        /**
         * Function to query the privacy proxy.
         * @param {Object} profile The profile used to query. The format is described at {@link https://github.com/EEXCESS/eexcess/wiki/%5B21.09.2015%5D-Request-and-Response-format#query-format}
         * @param {APIconnector~onResponse} callback Callback function called on success or error. 
         */
        query: function(profile, callback) {
            if (!profile.loggingLevel) {
                profile.loggingLevel = settings.loggingLevel;
            }
            profile.origin = complementOrigin(profile.origin);
            if (!profile.numResults) {
                profile.numResults = settings.numResults;
            }
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
                response['profile'] = profile;
                response['faviconURL'] = settings.base_url + settings.suffix_favicon;
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
         * Function to query the privacy proxy using the PEAS indistinguishability protocol. 
         * @param {Object} profile The profile used to query. The format is described at {@link https://github.com/EEXCESS/eexcess/wiki/%5B21.09.2015%5D-Request-and-Response-format#query-format}
         * @param {Integer} k Number of fake queries to add to the profile. Must be greater than zero. 
         * @param {APIconnector~onResponse} callback Callback function called on success or error. 
         */
        queryPeas: function(profile, k, callback) {
            var obfuscatedProfile = peas_indist.obfuscateQuery(profile, k);
            this.query(obfuscatedProfile, function(results) {
                if (results.status === "success") {
                    var filteredResults = peas_indist.filterResults(results.data, profile);
                    filteredResults.profile = profile;
                    callback({status: results.status, data: filteredResults});
                } else {
                    callback({status: results.status, data: results.data});
                }
            });
        },
        /**
         * Function to retrieve details for a set of returned results.
         * @param {Array} documentBadges The set of documentbadges for which details should be retrieved. 
         *                There exists a documentbagde for each result entry in the original result set. 
         *                See https://github.com/EEXCESS/eexcess/wiki/Request-and-Response-format-for-call-to-federated-recommender-and-privacy-proxy#details-request-format for more details.
         * @param {APIconnector~onResponse} callback Callback function called on success or error. 
         */
        getDetails: function(detailReqObj, callback) {
            detailReqObj.loggingLevel = settings.loggingLevel;
            detailReqObj.origin = complementOrigin(detailReqObj.origin);
            var xhr = $.ajax({
                url: settings.base_url + settings.suffix_details,
                data: JSON.stringify(detailReqObj),
                type: 'POST',
                contentType: 'application/json; charset=UTF-8',
                dataType: 'json',
                timeout: settings.timeout
            });
            xhr.done(function(response) {
                callback({status: 'success', data: response});
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
        },
        /**
         * Enum for logging interaction types
         */
        logInteractionType: {
            moduleOpened: "moduleOpened",
            moduleClosed: "moduleClosed",
            moduleStatisticsCollected: "moduleStatisticsCollected",
            itemOpened: "itemOpened",
            itemClosed: "itemClosed",
            itemCitedAsImage: "itemCitedAsImage",
            itemCitedAsText: "itemCitedAsText",
            itemCitedAsHyperlink: "itemCitedAsHyperlink",
            itemRated: "itemRated"
        },
        /**
         * Function to send a log event to the logging endpoint
         * @param {String} interactionType The type of interaction to be logged. See `APIconnector.logInteractionType` for a list of possible interactions
         * @param {Object} logEntry The entry to be logged. The format is described at {@link https://github.com/EEXCESS/eexcess/wiki/EEXCESS---Logging}
         */
        sendLog: function(interactionType, logEntry) {
            if (settings.loggingLevel === 0) {
                logEntry.origin = complementOrigin(logEntry.origin);
                var xhr;
                xhr = $.ajax({
                    url: settings.base_url + settings.suffix_log + interactionType,
                    data: JSON.stringify(logEntry),
                    type: 'POST',
                    contentType: 'application/json; charset=UTF-8',
                    timeout: settings.logTimeout
                });
            }
        },
        /**
         * Function to retrieve the partner sources registered at the recommender. See {@link https://github.com/EEXCESS/eexcess/wiki/Federated-Recommender-Service#get-registered-partners}.
         * @param {function} callback Callback function on success or error. The parameter of this function is an object with the attribute 'status', indicating either success or error and an attribute 'data', containing the response on success and error details on error. 
         */
        getRegisteredPartners: function(callback) {
            xhr = $.ajax({
                url: settings.base_url + settings.suffix_getRegisteredPartners,
                type: 'GET',
                timeout: 5000
            });
            xhr.done(function(response) {
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
        setLoggingLevel: function(logLevel) {
            settings.loggingLevel = logLevel;
        }
    };
});