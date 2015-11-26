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

                return -1;
            },
            /**
             * Creates the markup code for the given document badge.
             *
             * @param documentBadge
             * @param markup_identifier
             * @param options
             * @return {string} Markup code for the document badge. If markup's identifier is unknown 'undefined'.
             */
            createMarkup: function (documentBadge, markup_identifier, options) {
                switch (markup_identifier) {
                    case this.markup.WIKI_CODE:
                        return "markup in wikicode"; // TODO return markup in wikicode
                    default: // unknown identifier
                        return undefined;
                }
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