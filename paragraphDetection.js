/**
 * A module to detect paragraphs in a webpage and enrich them with named entities.
 * In addition, it provides functionality to show an icon when hovering over a link and execute a custom trigger function.
 * 
 * @module c4/paragraphDetection
 */

/**
 * Trigger function for the link augmentation
 * @callback paragraphDetection~linkTrigger
 * @param {{contextKeywords:Array<{weight:Number,text:String}>}|{contextKeywords:Array<{weight:Number,text:String}>,contextNamedEntities:Object}} profile Contains the linktext of the augmented link in contextKeywords and may contain named entities in contextNamedEntities.
 */
define(['jquery', 'c4/namedEntityRecognition'], function($, ner) {
    var settings = {
        prefix: 'eexcess',
        classname: 'eexcess_detected_par'
    };
    var getCandidates = function(root) {
        if (typeof root === 'undefined') {
            root = document.body;
        }
        ;
        var pars = [];
        var walker = document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT
                );

        var node = walker.nextNode();
        /**
         * loop over text nodes and add their parents to the candidate set, subject to the following conditions:
         * - parent must not be a script, style or noscript tag
         * - text node must contain at least 41 characters
         * - parent is not contained in the candidate set yet
         */
        while (node) {
            var containsText = node.nodeValue.search(/\S+/);
            var parent = node.parentNode.nodeName;
            var cond1 = parent !== 'SCRIPT'; // exclude script areas
            var cond2 = parent !== 'STYLE';  // exclude style areas
            var cond3 = parent !== 'NOSCRIPT'; // exclude noscript areas
            var minLength = node.nodeValue.length > 40;
            if (containsText !== -1 && cond1 && cond2 && cond3 && minLength) {
                if (pars.indexOf(node.parentNode) === -1) {
                    pars.push(node.parentNode);
                }
                // do not traverse deeper (to leaves) in the tree, since child elements are already contained in the candidate.
                walker.currentNode = node.parentNode;
                node = walker.nextSibling();
            } else {
                node = walker.nextNode();
            }
        }
        return pars;
    };
    var getHeadline = function(paragraphNode) {
        var walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_ELEMENT
                );

        var node = paragraphNode;
        walker.currentNode = node;
        while (node = walker.previousNode()) {
            if (node.nodeName.indexOf('H') === 0) {
                return node;
            }
        }
        return null;
    };
    var paragraphUtil = function(pars, idx) {
        var text = '';
        for (var i = 0; i < pars.length; i++) {
            text += $(pars[i]).text();
        }
        $(pars).wrapAll('<div id="' + settings.prefix + '_par_' + idx + '" data-idx="' + idx + '" class="' + settings.classname + '" style="border:1px solid green"></div>');
        return {
            elements: pars,
            headline: $(getHeadline(pars[0])).text(),
            content: text,
            multi: (pars.length > 1),
            id: settings.prefix + '_par_' + idx
        };
    };
    var delayTimer = {
        setTimer: function(callback, delay) {
            if (typeof delay === 'undefined') {
                delay = 100;
            }
            this.callback = callback;
            this.timeoutID = window.setTimeout(callback, delay);
        },
        clearTimer: function() {
            window.clearTimeout(this.timeoutID);
            delete this.timeoutID;
        }
    };
    return {/**
     * Initializes the module with parameters other than the defaults.
     * @param {Object} config The configuration to be set. Only the parameters to change need to be specified.
     * @param {String} config.prefix The prefix to be used in div-ids wrapping detected paragraphs.
     * @param {String} config.classname The classname to be used in divs, which wrap detected paragraphs.
     */
        init: function(config) {
            settings = $.extend(settings, config);
        },
        /**
         * Returns the current settings.
         * @returns {{prefix:String,classname:String}} The settings.
         */
        getSettings: function() {
            return settings;
        },
        /**
         * Detects the paragraphs in the HTML document the script is executed.
         * @param {HTMLelement} root The root node from which to start the paragraph detection.
         * @returns {Array<{elements:HTMLelement[],headline:String,content:String,multi:Boolean,id:String}>} The paragraphs
         */
        getParagraphs: function(root) {
            var candidates = getCandidates(root);
            var paragraphs = [];
            var counter = 0;

            /**
             * find neighbouring candidates and group them together in a single paragraph
             */
            for (var i = 0; i < candidates.length; i++) {
                var next = candidates[i].nextSibling;
                var sole = true;
                var j = i;
                var neighbours = [];
                while (next !== null) {
                    // candidates are considered neighbours, if they are not separated by HTMLelements other than text
                    if (next.nodeName !== '#text') {
                        var idx = $.inArray(next, candidates, j);
                        if (idx > -1) {
                            j = idx;
                            neighbours.push(candidates[j]);
                            sole = false;
                            next = next.nextSibling;
                        } else {
                            next = null;
                        }
                    } else {
                        next = next.nextSibling;
                    }
                }

                if (sole) {
                    // single paragraphs must consist of at least 100 characters and contain a dot
                    var text = $(candidates[i]).text();
                    if (text.length > 100 && text.indexOf('.') > -1) {
                        paragraphs.push(paragraphUtil([candidates[i]], counter));
                        counter++;
                    }
                } else {
                    neighbours.unshift(candidates[i]);
                    paragraphs.push(paragraphUtil(neighbours, counter));
                    counter++;
                    i = j;
                }
            }
            return paragraphs;
        },
        /**
         * Enrich paragraphs with named entities.
         * @param {Array<{id:String,headline:String,content:String}>} paragraphs The paragraphs to enrich.
         * @param {Array} statistic The statistic used to enrich the paragraphs.
         * @returns {Array<{id:String,headline:String,content:String,entities:Object}>} The enriched paragraphs.
         */
        enrichParagraphs: function(paragraphs, statistic) {
            if (paragraphs.length !== statistic.length) {
                console.log('paragraphs do not match statistic');
                return;
            }
            paragraphs.forEach(function(val, idx) {
                var extended = statistic[idx];
                // paragraphs and statistic may not be in the same order
                if (val.id !== extended.id) {
                    for (var i = 0; i < statistic.length; i++) {
                        if (val.id === statistic[i].id) {
                            extended = statistic[i];
                            break;
                        }
                    }
                }
                val.entities = ner.entitiesFromStatistic(extended.statistic);
            });
            return paragraphs;
        },
        /**
         * Get the current selection in the document.
         * If an enriched paragraph object is passed to this function, then corresponding entities will be added to the selection, if text was selected in one of the provided paragraphs.
         * @param {Array<{id:String,headline:String,content:String,entities:Object}>} [paragraphs] Paragraphs and corresponding entities.
         * @returns {{selection:String}|{selection:String,entities:{persons:Array,organizations:Array,locations:Array,misc:Array}}} The selection [and corresponding entities]
         */
        getSelection: function(paragraphs) {
            var retVal = {
                selection: document.getSelection().toString()
            };
            if (typeof paragraphs !== 'undefined' && retVal.selection.length > 0) {
                var parentPars = $(window.getSelection().getRangeAt(0).commonAncestorContainer).parents('.' + settings.classname);
                if (parentPars.length === 1) {
                    var idx = parentPars[0].dataset.idx;
                    if (idx && idx < paragraphs.length && parentPars[0].id === paragraphs[idx].id && paragraphs[idx].entities) {
                        retVal.entities = paragraphs[idx].entities;
                    }
                } else if (parentPars.length > 1) {
                    console.log('multiple paragraphs');
                    // TODO: entities from multiple paragraphs
                }
            }
            return retVal;
        },
        /**
         * Augments links in a set of jquery-elements with an icon on hover and triggers a custom function, when this icon is clicked.
         * @param {Array<JQuery>} jqElements A set of jquery-elements in which to augment links.
         * @param {String} icon Path to the icon image.
         * @param {paragraphDetection~linkTrigger} triggerFn The function to trigger when the icon is clicked.
         * @param {String} classname The class name, that was used to wrap detected paragraphs.
         * @param {Array<{id:String,headline:String,content:String,entities:Object}>} [extendedParagraphs] Paragraphs enriched with named entities.
         */
        augmentLinks: function(jqElements, icon, triggerFn, classname, extendedParagraphs) {
            var img = $('<img src="' + icon + '" style="cursor:pointer;width:30px;" />');
            img.click(function() {
                var profile = {
                    // TODO: split terms
                    contextKeywords: [{
                            weight: 1.0,
                            text: $(this).data('query')
                        }]
                };
                if (typeof extendedParagraphs !== 'undefined') {
                    var parID = $(this).data('paragraphID');
                    var idx = $(this).data('idx');
                    if (extendedParagraphs[idx].id === parID) {
                        profile.contextNamedEntities = extendedParagraphs[idx].entities;
                    } else {
                        // TODO: order of extendedParagraphs is not guaranteed, search for right id
                    }
                }
                triggerFn(profile);
            }).hover(function() {
                delayTimer.clearTimer();
            }, function() {
                $(this).hide();
            }).css('position', 'absolute')
                    .css('z-index', 9999)
                    .mouseleave(function() {
                $(this).hide();
            })
                    .hide();
            $('body').append(img);
            var xOffset = 25;
            var yOffset = -2;
            jqElements.find('a').each(function() {
                var el = $(this);
                if (el.text().length > 3) {
                    var wrapper = $('<div style="display:inline;"></div>');
                    wrapper.mouseenter(function(evt) {
                        console.log('mouseenter');
                        var parents = el.parents('.' + classname);
                        delayTimer.clearTimer();
                        img.data('query', el.text());
                        img.data('paragraphID', parents[0].id);
                        img.data('idx', parents[0].dataset.idx);
                        var el2 = $(this);
                        var offset = el2.offset();
                        img
                                .css('top', (offset.top - el2.height() + yOffset) + 'px')
                                .css('left', offset.left - xOffset + 'px')
                                .show();
                    });
                    wrapper.mouseleave(function() {
                        delayTimer.setTimer(function() {
                            img.hide();
                        });
                    });
                    el.wrap(wrapper);
                }
            });
        }
    };
});