define(['jquery'], function($) {
    var endpoint = 'http://zaire.dimis.fim.uni-passau.de:8999/doser-disambiguationserverstable/webclassify/entityAndCategoryStatistic';
    var xhr;

    return {
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