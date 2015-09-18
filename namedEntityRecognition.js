/**
 * A module to query the EEXCESS named entitiy recognition and disambiguation service.
 * 
 * @module c4/namedEntityRecognition
 */

/**
 * Callback for the entitiesAndCategories function
 * @callback namedEntityRecognition~onResponse
 * @param {String} status Indicates the status of the request, either "success" or "error". 
 * @param {Object} data Contains the response data. In the case of an error, it is the error message and in the case of success, it is the response returned from the named entity recognition service. TODO: add link to documentation
 */

define(['jquery'], function($) {
    var endpoint = 'https://eexcess-dev.joanneum.at/eexcess-privacy-proxy-issuer-1.0-SNAPSHOT/issuer/entityRecognition';
    var xhr;

    return {
        /**
         * Retrieves named entities and associated categories for a set of paragraphs.
         * @param {Array<{id:String,headline:String,content:String}>} paragraphs The paragraphs to annotate.
         * @param {namedEntityRecognition~onResponse} callback Callback function called on success or error.
         */
        entitiesAndCategories: function(paragraphs, callback) {
            if (xhr && xhr.readyState !== 4) {
                xhr.abort();
            }
            xhr = $.ajax({
                url: endpoint,
                data: JSON.stringify({paragraphs: paragraphs}),
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json'
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
        /**
         * Tramsforms a statistic returned from the named entity recognition service into an object, which contains the entities in attributes as persons, organizations, locations and misc. Each of those attributes contains an Array of entity-objects, with the attributes "text" (the entity's label), "weight" (#occurences in the associated paragraph), "confidence" and "uri".
         * @param {Array} statistic Statistic returned from the named entity recognition service.
         * @returns {{persons:Array,organizations:Array,locations:Array,misc:Array}} The entities.
         */
        entitiesFromStatistic: function(statistic) {
            var converter = function(el) {
                var entity = {
                    text: el.key.text,
                    weight: el.value,
                    confidence: el.key.confidence,
                    uri: el.key.entityUri
                };
                return entity;
            };
            var entities = {
                persons: [],
                organizations: [],
                locations: [],
                misc: []
            };
            for (var i = 0; i < statistic.length; i++) {
                switch (statistic[i].key.type) {
                    case 'Person':
                        entities.persons.push(converter(statistic[i]));
                        break;
                    case 'Organization':
                        entities.organizations.push(converter(statistic[i]));
                        break;
                    case 'Location':
                        entities.locations.push(converter(statistic[i]));
                        break;
                    default:
                        entities.misc.push(converter(statistic[i]));
                        break;
                }
            }
            return entities;
        }
    };
});