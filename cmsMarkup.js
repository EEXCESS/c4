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
             * @param markup_identifier specifies the markup type to produce
             * @return {string} Markup code for the document. If the document's information is incomplete or the markup's identifier is unknown 'undefined'.
             */
            createMarkup: function (documentInformation, markup_identifier) {
                var mediaType = documentInformation.mediaType.toLowerCase();

                switch (markup_identifier) {
                    case this.markup.WIKI_CODE:
                        var title = documentInformation.title;

                        if (mediaType === "text") {
                            return title + ' <ref>[' + documentInformation.documentBadge.uri + ' ' + title + ']</ref>';
                        } else if (mediaType === "image") {
                            var caption = title.split(/[:.]+/)[1]; // 'File:Example.jpg' -> 'Example'
                            return '[[' + title + '|thumbnail|' + caption + ']]';
                        }
                }

                return undefined; // unknown markup identifier or media type
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