/**
 * CMS markup module
 * You can include the module either with require.js or in the normal html-way
 * Once included, its functionality (detecting markup and creating markup code) is available in a global 'cmsMarkup'variable.
 * The constant 'markup' containing the supported markups is also provided.
 */
(function () {
    var cmsFunc = function ($) {
        return {
            // known markups
            markup: {
                UNKNOWN: -1,
                WIKI_CODE: 0
            },

            /**
             * Detects the used CMS and its markup language.
             *
             * @return {number} The detected markup's identifier. If unknown -1
             */
            detectMarkup: function () {
                // mediawiki
                var detected = $('meta[name=generator]').attr("content").indexOf("MediaWiki") >= 0; // meta-tag
                detected = detected || $('textarea#wpTextbox1').length === 1; // editor

                if (detected)
                    return this.markup.WIKI_CODE;

                return this.markup.UNKNOWN;
            },
            /**
             * Creates the markup code for the given document document information.
             *
             * @param documentInformation   contains the documents' information needed for the markup creation
             * @param markup_identifier     specifies the markup type to produce
             * @return {string}             Markup code for the document. If the document's information is incomplete or the
             *                              markup's identifier is unknown 'undefined'.
             */
            createMarkup: function (documentInformation, markup_identifier) {
                var mediaType = documentInformation.mediaType.toLowerCase();

                switch (markup_identifier) {
                    case this.markup.WIKI_CODE:
                        var title = documentInformation.title;
                        var provider = documentInformation.documentBadge.provider;
                        var year = documentInformation.date;

                        if (year) {
                            year = year.substr(0, 4);

                            if (isNaN(parseFloat(year)) || !isFinite(year)) {
                                year = undefined;
                            }
                        }

                        if (mediaType === "text") {
                            var citation = '"' + title + '" <ref>"[' + documentInformation.documentBadge.uri + ' ' + title + ']"' + (provider ? (', ' + provider) : '') + (year ? (', ' + year) : '') + '</ref>'
                            return citation;
                        } else if (mediaType === "image") {
                            var caption = title.split(/[:.]+/)[1]; // 'File:Example.jpg' -> 'Example'
                            return '[[' + title + '|thumbnail|' + caption + ']]';
                        }
                }

                return undefined; // unknown markup identifier or media type
            },

            /**
             * Returns the linguistic instance of the current CMS specified by its markup identifier or the browser's
             * language, if the linguistic instance can't be determined specifically.
             *
             * @param markup_identifier specifies the markup used by the current CMS
             * @return {string}         2-digit country code of the detected language
             */
            detectLang: function (markup_identifier) {
                switch (markup_identifier) {
                    case this.markup.WIKI_CODE:
                        var language = document.location.origin.split(/[/.]+/)[1];

                        if (language.length === 2)
                            return language;
                }

                // linguistic instance can't be determined specifically for the CMS -> return the browser's language
                var browserLang = navigator.language || navigator.userLanguage;
                return browserLang.substr(0, 2);
            }
        };
    };

    if (typeof require !== 'undefined') {
        define(['jquery'], cmsFunc);
    } else {
        // requires jquery
        cmsMarkup = cmsFunc();
    }
})();