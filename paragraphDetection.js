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

/**
 * Callback for the paragraphToQuery function
 * @callback paragraphToQuery~callback
 * @param {query:Object,error:String} The result of the extraction. If the extraction was successful,
 * the generated query profile will be present in the attribute 'query'. Otherwise,
 * if an error message is available, it will be present in the 'error' attribute.
 */

define(['jquery', 'c4/namedEntityRecognition'], function($, ner) {
    var extracted_paragraphs = [];
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
        $(pars).wrapAll('<div id="' + settings.prefix + '_par_' + idx + '" data-idx="' + idx + '" class="' + settings.classname + '"></div>');
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
            if (typeof root === 'undefined') {
                root = document;
            }
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
            extracted_paragraphs = paragraphs;
            return paragraphs;
        },
        /**
         * Create a EEXCESS query profile for a given piece of text. 
         * 
         * The profile will be in the format as described at https://github.com/EEXCESS/eexcess/wiki/%5B21.09.2015%5D-Request-and-Response-format#query-format
         * with the contextKeywords attribute filled with the keywords extracted
         * from the given text. 
         * @param {String} paragraphContent The text from which to extract the keywords
         * @param {paragraphToQuery~callback} callback The callback function
         * @param {String} [id] An identifier for the paragraph
         * @param {String} [headline] The headline for the paragraph
         * @returns {undefined}
         */
        paragraphToQuery: function(paragraphContent, callback, id, headline) {
            if (typeof id === 'undefined') {
                id = 1;
            }
            if (typeof headline === 'undefined') {
                headline = "";
            }
            var paragraphs = [{
                    id: id,
                    headline: headline,
                    content: paragraphContent
                }];
            ner.entitiesAndCategories(paragraphs, function(res) {
                // TODO: there might not be any mainTopic nor entities
                if (res.status === 'success') {
                    var profile = {
                        contextKeywords: []
                    };
                    // add main topic
                    if (res.data.paragraphs[0].topic && typeof res.data.paragraphs[0].topic !== 'undefined' && typeof res.data.paragraphs[0].topic.text !== 'undefined') {
                        var mainTopic = {
                            text: res.data.paragraphs[0].topic.text,
                            uri: res.data.paragraphs[0].topic.entityUri,
                            type: res.data.paragraphs[0].topic.type,
                            isMainTopic: true
                        };
                        profile.contextKeywords.push(mainTopic);
                    }
                    // add other keywords
                    $.each(res.data.paragraphs[0].statistic, function() {
                        if (this.key.text !== mainTopic.text) {
                            profile.contextKeywords.push({
                                text: this.key.text,
                                uri: this.key.entityUri,
                                type: this.key.type,
                                isMainTopic: false
                            });
                        }
                    });
                    callback({query: profile});
                } else {
                    // TODO: add simple fallback
                    callback({error: res.data});
                }
            });
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
        },
        /**
         * Find the paragraph the user is currently looking at.
         * 
         * If the focused paragraph changes, a 'paragraphFocused' event will be dispatched with he focused paragraph attached.
         * 
         * @param {Array<{elements:HTMLelement[],headline:String,content:String,multi:Boolean,id:String}>} paragraphs
         * @returns {undefined}
         */
        findFocusedParagraph: function(paragraphs) {
            var w1 = 0.1; // weight for size relation
            var w2 = 1; // weight for distance to top left corner
            var w3 = 3; // weight for distance to cursor
            var mouseEvtCounter = 0;
            var scrollTimer;
            var resizeTimer;
            var mouseTimer;
            var diagonal = Math.sqrt($(window).height() * $(window).height() + $(window).width() * $(window).width());
            var biggestArea = 0;
            if (typeof paragraphs !== 'undefined') {
                extracted_paragraphs = paragraphs;
            }
            calculateSizeRelation();
            var visiblePars = getVisible(extracted_paragraphs);
            updateDistance();

            // initalize
            updateCursorDistance(0, 0);
            updateProbabilities();


            // TODO: calculate dynamically for elements in viewport?
            function calculateSizeRelation() {
                // calculate areas 
                $(extracted_paragraphs).each(function() {
                    var width = 0;
                    var height = 0;
                    $(this.elements).each(function() {
                        if ($(this).width() > width) {
                            width = $(this).width();
                        }
                        height += $(this).height();
                    });
                    this.area = width * height;
                    if (this.area > biggestArea) {
                        biggestArea = this.area;
                    }
                });
                // calculate size relation`
                $(extracted_paragraphs).each(function() {
                    this.sizeRelation = this.area / biggestArea;
                });
            }

            function getVisible(paragraphs) {
                var visibleElements = new Set();
                var offset = $(window).scrollTop() + $(window).height();
                $(paragraphs).each(function() {
                    var top = $(this.elements[0]).offset().top;
                    if (offset > top && top > $(window).scrollTop()) {
                        this.cursorDistance = 0;
                        visibleElements.add(this);
                    }
                });
                return visibleElements;
            }

            function updateProbabilities() {
                var highestProb = 0;
                var focusedPar;
                visiblePars.forEach(function(v1) {
                    v1.pGotRead = w1 * v1.sizeRelation + w2 * v1.distance + w3 * v1.cursorDistance;
//                var out = w1 * v1.sizeRelation + '+' + w2 * v1.distance + '+' + w3 * v1.cursorDistance + '=' + v1.pGotRead;
//                if ($(v1.elements[0]).find($('.pgotread')).length > 0) {
//                    $(v1.elements[0]).find($('.pgotread')).text(out);
//                } else {
//                    $(v1.elements[0]).prepend('<span class="pgotread" style="color:red;">' + out + '</span>');
//                }
                    if (v1.pGotRead > highestProb) {
                        highestProb = v1.pGotRead;
                        focusedPar = v1;
                    }
                });
                // event might be dispatched multiple times, leave the handling to the listener
                var event = new CustomEvent('paragraphFocused', {detail: focusedPar});
                document.dispatchEvent(event);
            }

            function updateDistance() {
                visiblePars.forEach(function(v1) {
                    var offset = $(v1.elements[0]).offset();
                    var left = offset.left - $(window).scrollLeft();
                    var top = offset.top - $(window).scrollTop();
                    if (top < 0) {
                        top = $(window).height();
                    }
                    var distToTopLeft = Math.sqrt(left * left + top * top);
                    v1.distance = 1 - (distToTopLeft / diagonal);
                });
            }

            function updateCursorDistance(pageX, pageY) {
                visiblePars.forEach(function(v1) {
                    var center = {
                        x: 0,
                        y: 0
                    };
                    var offset = $(v1.elements[0]).offset();
                    var height = 0;
                    var width = 0;
                    $(v1.elements).each(function() {
                        height += $(this).height();
                        if (width < $(this).width()) {
                            width = $(this).width();
                        }
                    });
                    // anchor center at bottom left corner
                    center.y = offset.top + height;
                    center.x = offset.left;
                    v1.cursorDistance = 1 - Math.sqrt(Math.pow(center.x - pageX, 2) + Math.pow(center.y - pageY, 2)) / diagonal;
                });
            }

            $(document).scroll(function(evt) {
                clearTimeout(scrollTimer);
                scrollTimer = setTimeout(function() {
                    w3 = 0.2; // reduce weight for mouse distance probability
                    visiblePars = getVisible(extracted_paragraphs);
                    updateDistance();
                    updateProbabilities();
                }, 100);
            });

            $(document).mousemove(function(e) {
                clearTimeout(mouseTimer);
                mouseEvtCounter++;
                mouseTimer = setTimeout(function() {
                    if (mouseEvtCounter > 10) {
                        w3 = 3; // increase weight for mouse distance probability
                        updateCursorDistance(e.pageX, e.pageY);
                        updateProbabilities();
                    }
                    mouseEvtCounter = 0;
                }, 100);
            });

            $(window).resize(function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function() {
                    diagonal = Math.sqrt($(window).height() * $(window).height() + $(window).width() * $(window).width());
                    calculateSizeRelation();
                    visiblePars = getVisible(extracted_paragraphs);
                    updateDistance();
                    updateProbabilities();
                }, 100);
            });
        }, /**
         * Find the paragraph the user is currently looking at. 
         * 
         * In this simplified version, the topmost left paragraph is regarded as focused, except for the user explicitly clicking on a paragraph.
         * 
         * If the focused paragraph changes, a 'paragraphFocused' event will be dispatched with he focused paragraph attached.
         * 
         * @param {Array<{elements:HTMLelement[],headline:String,content:String,multi:Boolean,id:String}>} paragraphs
         * @returns {undefined}
         */
        findFocusedParagraphSimple: function(paragraphs) {
            var scrollTimer;
            if (typeof paragraphs !== 'undefined') {
                extracted_paragraphs = paragraphs;
            }
            $.each(extracted_paragraphs, function() {
                var that = this;
                $(this.elements[0]).parent().click(function(e) {
                    var event = new CustomEvent('paragraphFocused', {detail: that});
                    document.dispatchEvent(event);
                });
            });
            var visiblePars = getVisible(extracted_paragraphs);
            updateDistance();
            updateProbabilities();

            function updateProbabilities() {
                var highestProb;
                var focusedPar;
                visiblePars.forEach(function(v1) {
                    v1.pGotRead = v1.distance;
                    if (!highestProb || v1.pGotRead < highestProb) {
                        highestProb = v1.pGotRead;
                        focusedPar = v1;
                    }
                });
                // event might be dispatched multiple times, leave the handling to the listener
                var event = new CustomEvent('paragraphFocused', {detail: focusedPar});
                document.dispatchEvent(event);
            }

            $(document).scroll(function(evt) {
                clearTimeout(scrollTimer);
                scrollTimer = setTimeout(function() {
                    visiblePars = getVisible(extracted_paragraphs);
                    updateDistance();
                    updateProbabilities();
                }, 100);
            });

            function getVisible(paragraphs) {
                var visibleElements = new Set();
                var offset = $(window).scrollTop() + $(window).height();
                $(paragraphs).each(function() {
                    var top = $(this.elements[0]).offset().top;
                    if (offset > top && top > $(window).scrollTop()) {
                        visibleElements.add(this);
                    }
                });
                return visibleElements;
            }
            function updateDistance() {
                visiblePars.forEach(function(v1) {
                    var offset = $(v1.elements[0]).offset();
                    var left = offset.left - $(window).scrollLeft();
                    var top = offset.top - $(window).scrollTop();
//                    if (top < 0) {
//                        top = $(window).height();
//                    }
                    v1.distance = Math.sqrt(left * left + top * top);
                });
            }
        }
    };
});