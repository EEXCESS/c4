/**
 * Logging module
 * You can include the module either with require.js or in the normal hmtl-way
 * Once included, the logging functionality is available in a global 'LOGGING' variable.
 */

(function() {
    var loggingFunc = function () {
        function LoggingFormatException(value, hint) {
            this.value = value;
            this.hint = hint;
            this.message = " is not of type ";
            this.toString = function() {
                return "LoggingFormatException: " + this.value + this.message + this.hint;
            };
        }
        return {
            /**
             *
             * @param {Object} origin A general identifier, that identifies client, module and user. See {@link https://github.com/EEXCESS/eexcess/wiki/EEXCESS---Logging#important-attributes} for details.
             * @param {String} moduleName The name of the module that was opened
             */
            moduleOpened: function (origin, moduleName) {
                if (typeof origin !== 'object') {throw new LoggingFormatException(origin, 'object')}
                if (typeof moduleName != 'string') {throw new LoggingFormatException(moduleName, 'string')}
                var eventData = {
                    origin: origin,
                    content: {
                        name: moduleName
                    }
                };
                window.top.postMessage({event: 'eexcess.log.moduleOpened', data: eventData}, '*');
            },
            /**
             *
             * @param {Object} origin A general identifier, that identifies client, module and user. See {@link https://github.com/EEXCESS/eexcess/wiki/EEXCESS---Logging#important-attributes} for details.
             * @param {String} moduleName The name of the module that was closed
             * @param {Number} duration (optional) The number of milliseconds the module has been open
             */
            moduleClosed: function (origin, moduleName, duration) {
                if (typeof origin != 'object') {throw new LoggingFormatException(origin, 'object')}
                if (typeof moduleName != 'string') {throw new LoggingFormatException(moduleName, 'string')}
                if (typeof duration != 'number') {throw new LoggingFormatException(duration, 'number')}
                var eventData = {
                    origin: origin,
                    content: {
                        name: moduleName,
                        duration: duration
                    }
                };
                window.top.postMessage({event: 'eexcess.log.moduleClosed', data: eventData}, '*');
            },
            /**
             *
             * @param {Object} origin A general identifier, that identifies client, module and user. See {@link https://github.com/EEXCESS/eexcess/wiki/EEXCESS---Logging#important-attributes} for details.
             * @param {Object} statistics Any object that should be logged as it is
             */
            moduleStatisticsCollected: function (origin, statistics) {
                if (typeof origin != 'object') {throw new LoggingFormatException(origin, 'object')}
                var eventData = {
                    origin: origin,
                    content: statistics
                };
                window.top.postMessage({event: 'eexcess.log.moduleStatisticsCollected', data: eventData}, '*');
            },
            /**
             *
             * @param {Object} origin A general identifier, that identifies client, module and user. See {@link https://github.com/EEXCESS/eexcess/wiki/EEXCESS---Logging#important-attributes} for details.
             * @param {Object} documentBadge The `documentBadge` of this item. See {@link https://github.com/EEXCESS/eexcess/wiki/EEXCESS---Logging#input-formats} for details on the format.
             * @param {String} queryID The identifier of the query that returned this item. See {@link https://github.com/EEXCESS/eexcess/wiki/EEXCESS---Logging#important-attributes} for details.
             */
            itemOpened: function (origin, documentBadge, queryID) {
                if (typeof origin != 'object') {throw new LoggingFormatException(origin, 'object')}
                if (typeof documentBadge != 'object') {throw new LoggingFormatException(documentBadge, 'object')}
                if (typeof queryID != 'string') {throw new LoggingFormatException(queryID, 'string')}
                var eventData = {
                    origin: origin,
                    content: {
                        documentBadge: documentBadge
                    },
                    queryID: queryID
                };
                window.top.postMessage({event: 'eexcess.log.itemOpened', data: eventData}, '*');
            },
            itemClosed: function (origin, documentBadge, queryID, duration) {
                if (typeof origin != 'object') {throw new LoggingFormatException(origin, 'object')}
                if (typeof documentBadge != 'object') {throw new LoggingFormatException(documentBadge, 'object')}
                if (typeof queryID != 'string') {throw new LoggingFormatException(queryID, 'string')}
                if (typeof duration != 'number') {throw new LoggingFormatException(duration, 'number')}
                var eventData = {
                    origin: origin,
                    content: {
                        documentBadge: documentBadge,
                        duration: duration
                    },
                    queryID: queryID
                };
                window.top.postMessage({event: 'eexcess.log.itemClosed', data: eventData}, '*');
            },
            itemCitedAsImage: function (origin, documentBadge, queryID) {
                if (typeof origin != 'object') {throw new LoggingFormatException(origin, 'object')}
                if (typeof documentBadge != 'object') {throw new LoggingFormatException(documentBadge, 'object')}
                if (typeof queryID != 'string') {throw new LoggingFormatException(queryID, 'string')}
                var eventData = {
                    origin: origin,
                    content: {
                        documentBadge: documentBadge
                    },
                    queryID: queryID
                };
                window.top.postMessage({event: 'eexcess.log.itemCitedAsImage', data: eventData}, '*');
            },
            itemCitedAsText: function (origin, documentBadge, queryID) {
                if (typeof origin != 'object') {throw new LoggingFormatException(origin, 'object')}
                if (typeof documentBadge != 'object') {throw new LoggingFormatException(documentBadge, 'object')}
                if (typeof queryID != 'string') {throw new LoggingFormatException(queryID, 'string')}
                var eventData = {
                    origin: origin,
                    content: {
                        documentBadge: documentBadge
                    },
                    queryID: queryID
                };
                window.top.postMessage({event: 'eexcess.log.itemCitedAsText', data: eventData}, '*');
            },
            itemCitedAsHyperlink: function (origin, documentBadge, queryID) {
                if (typeof origin != 'object') {throw new LoggingFormatException(origin, 'object')}
                if (typeof documentBadge != 'object') {throw new LoggingFormatException(documentBadge, 'object')}
                if (typeof queryID != 'string') {throw new LoggingFormatException(queryID, 'string')}
                var eventData = {
                    origin: origin,
                    content: {
                        documentBadge: documentBadge
                    },
                    queryID: queryID
                };
                window.top.postMessage({event: 'eexcess.log.itemCitedAsHyperlink', data: eventData}, '*');
            },
            /**
             *
             * @param {Object} origin A general identifier, that identifies client, module and user. See {@link https://github.com/EEXCESS/eexcess/wiki/EEXCESS---Logging#important-attributes} for details.
             * @param {Object} documentBadge The `documentBadge` of this item. See {@link https://github.com/EEXCESS/eexcess/wiki/EEXCESS---Logging#input-formats} for details on the format.
             * @param {String} queryID The identifier of the query that returned this item. See {@link https://github.com/EEXCESS/eexcess/wiki/EEXCESS---Logging#important-attributes} for details.
             * @param {Number} minRating The lowest rating a user can assign to an item (most negative)
             * @param {Number} maxRating The highest rating a user can assign to an item (most positive)
             * @param {Number} rating The actual rating a user assigned to the rated item. See {@link https://github.com/EEXCESS/eexcess/wiki/EEXCESS---Logging#input-formats} for details.
             */
            itemRated: function (origin, documentBadge, queryID, minRating, maxRating, rating) {
                if (typeof origin != 'object') {throw new LoggingFormatException(origin, 'object')}
                if (typeof documentBadge != 'object') {throw new LoggingFormatException(documentBadge, 'object')}
                if (typeof queryID != 'string') {throw new LoggingFormatException(queryID, 'string')}
                if (typeof minRating != 'number') {throw new LoggingFormatException(minRating, 'number')}
                if (typeof maxRating != 'number') {throw new LoggingFormatException(maxRating, 'number')}
                if (typeof rating != 'number') {throw new LoggingFormatException(rating, 'number')}
                var eventData = {
                    origin: origin,
                    content: {
                        documentBadge: documentBadge,
                        rating: {
                            minRating: minRating,
                            maxRating: maxRating,
                            rating: rating
                        }
                    },
                    queryID: queryID
                };
                window.top.postMessage({event: 'eexcess.log.itemRated', data: eventData}, '*');
            }
        }
    };
    if (typeof require != 'undefined') {
        /**
         * A module to log interactions from EEXCESS components
         * @module c4/logging
         */

        /**
         * Callback used by query
         * @callback LOGconnector~onResponse
         * @param {String} status Indicates the status of the request, either "success" or "error".
         * @param {Object} data Contains the response data. In the case of an error, it is the error message and in the case of success, it is the response returned from the Privacy Proxy in the format described at {@link https://github.com/EEXCESS/eexcess/wiki/json-exchange-format#response-format}. The profile that lead to this response is included in an additional attribute "profile".
         */
        define([], loggingFunc);
    } else {
        LOGGING = loggingFunc();
    }
})();