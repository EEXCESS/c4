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

define(['jquery', 'c4/namedEntityRecognition', 'guessLang/guessLanguage'], function($, ner, guessLang) {
    var extracted_paragraphs = [];
    var settings = {
        prefix: 'eexcess',
        classname: 'eexcess_detected_par'
    };
    var getCandidates = function(root) {
        if (typeof root === 'undefined') {
            root = document.body;
        };
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
            var cond2 = parent !== 'STYLE'; // exclude style areas
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
    return {
        /**
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

            // ######################### connect neighbours ########################
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
            // ############################################## DO NOT CONNECT NEIGHBOURS #################################
            //            candidates = new Set(candidates); // TODO: is this really necessary?
            //            candidates.forEach(function(val) {
            //                var text = $(val).text();
            //                if (text.length > 100 && text.indexOf('.') > -1) {
            //                    paragraphs.push(paragraphUtil([val], counter));
            //                    counter++;
            //                }
            //            });
            // ##############################################################################################################
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
            var fallback = function(text) {
                var profile = {
                    contextKeywords: []
                };
                var offsets = [];
                var test_candidate = function(word, len) {
                    word = word.trim();
                    if (word.length < len) {
                        return false;
                    }
                    var first = word.charAt(0);
                    if (first === first.toUpperCase() && first !== first.toLowerCase()) {
                        return word;
                    } else {
                        return false;
                    }
                };
                var textRank = function(text, k) {
                    var maxIter = 100;
                    var damping = 0.85;
                    var delta = 0.5;
                    var distance = 3;
                    var constructGraph = function(text, dist) {
                        var g = {
                            nodes: [],
                            vocabulary: []
                        };
                        var split = text.split(/[^a-zA-ZäöüÄÖÜßÀàÂâÆæÇçÈèÉéÊêËëÎîÏïÔôŒœÙùÛûŸÿ]/);
                        var tagged = [];
                        split.forEach(function(val) {
                            var first = val.charAt(0);
                            var tag = 'OTH';
                            if (first === first.toUpperCase() && first !== first.toLowerCase() && val.length > 3) {
                                tag = 'NN';
                            }
                            var arr = [];
                            arr.push(val);
                            arr.push(tag);
                            tagged.push(arr);
                        });
                        for (var i = 0; i < tagged.length; ++i) {
                            if (tagged[i][1] === 'NN') {
                                var termA = tagged[i][0];
                                var vocabularyIdx = g.vocabulary.indexOf(termA);
                                if (vocabularyIdx === -1) {
                                    vocabularyIdx = g.vocabulary.length;
                                    g.vocabulary.push(termA);
                                    g.nodes[vocabularyIdx] = {
                                        adjacent: new Set(),
                                        weightOld: 1.0,
                                        weightNew: 0
                                    };
                                }
                                for (var j = i + 1; j < i + dist && j < tagged.length; ++j) {
                                    if (tagged[j][1] === 'NN') {
                                        var termB = tagged[j][0];
                                        if (termA === termB) {
                                            continue;
                                        }
                                        var vocIdxCO = g.vocabulary.indexOf(termB);
                                        if (vocIdxCO === -1) {
                                            vocIdxCO = g.vocabulary.length;
                                            g.vocabulary.push(termB);
                                            g.nodes[vocIdxCO] = {
                                                adjacent: new Set(),
                                                weightOld: 1.0,
                                                weightNew: 0
                                            };
                                        }
                                        g.nodes[vocabularyIdx].adjacent.add(vocIdxCO);
                                        g.nodes[vocIdxCO].adjacent.add(vocabularyIdx);
                                    }
                                }
                            }
                        }
                        return g;
                    };

                    var textRank = function(graph, d) {
                        var max_change = 0;
                        for (var i = 0; i < graph.nodes.length; i++) {
                            var sum_score = 0;
                            graph.nodes[i].adjacent.forEach(function(v1, v2, set) {
                                sum_score += graph.nodes[v1].weightOld / graph.nodes[v1].adjacent.size;
                            });
                            graph.nodes[i].weightNew = (1 - d) + d * sum_score;
                        }
                        for (var i = 0; i < graph.nodes.length; i++) {
                            var change = Math.abs(graph.nodes[i].weightNew - graph.nodes[i].weightOld);
                            if (change > max_change) {
                                max_change = change;
                            }
                            graph.nodes[i].weightOld = graph.nodes[i].weightNew;
                            graph.nodes[i].weightNew = 0;
                        }
                        return max_change;
                    };

                    var topK = function(graph, k) {
                        var result = [];
                        for (var i = 0; i < graph.nodes.length; i++) {
                            var node = graph.nodes[i];
                            result.push({
                                term: graph.vocabulary[i],
                                weight: node.weightOld
                            });
                        }
                        result.sort(function(a, b) {
                            return b.weight - a.weight;
                        });

                        var finalSet = new Set();
                        for (var i = 0; i < k && i < result.length; i++) {
                            finalSet.add(result[i].term);
                        };
                        return finalSet;
                    };

                    var graph = constructGraph(text, distance);

                    // calculate textRank
                    for (var i = 0; i < maxIter; i++) {
                        var change = textRank(graph, damping);
                        if (change <= (delta / graph.nodes.length)) {
                            break;
                        }
                    }
                    return topK(graph, k);
                };
                text = text.trim();
                var test_split = text.split(/[^a-zA-ZäöüÄÖÜßÀàÂâÆæÇçÈèÉéÊêËëÎîÏïÔôŒœÙùÛûŸÿ]/);
                if (test_split.length < 5) {
                    profile.contextKeywords.push({
                        text: text
                    });
                    offsets[text] = [paragraphContent.indexOf(text)];
                    callback({
                        query: profile,
                        offsets: offsets
                    });
                    return;
                }
                var sents = text.split(/[.!?]/);
                var keywords = new Set();
                sents.forEach(function(val) {
                    var words = val.split(/[^a-zA-ZäöüÄÖÜßÀàÂâÆæÇçÈèÉéÊêËëÎîÏïÔôŒœÙùÛûŸÿ]/);
                    for (var i = 0; i < words.length; i++) {
                        var keyword = test_candidate(words[i], 3);
                        if (keyword) {
                            var candidate;
                            i++;
                            while (i < words.length && (candidate = test_candidate(words[i], 2))) {
                                keyword += ' ' + candidate;
                                i++;
                            }
                            if (keyword.length > 4) {
                                keywords.add(keyword);
                            }
                        }
                    }
                });
                var tmpArr = [];
                keywords.forEach(function(val) {
                    tmpArr.push(val);
                });
                keywords = [];
                tmpArr.sort(function(a, b) {
                    if (a.length < b.length) {
                        return -1;
                    }
                    if (a.length > b.length) {
                        return 1;
                    }
                    return 0;
                });
                for (var i = 0; i < tmpArr.length; ++i) {
                    var contained = false;
                    for (var j = i + 1; j < tmpArr.length; ++j) {
                        if (tmpArr[j].indexOf(tmpArr[i]) !== -1) {
                            contained = true;
                        }
                    }
                    if (!contained) {
                        keywords.push(tmpArr[i]);
                    }
                }
                if (keywords.length > 10) {
                    var finalSet = new Set();
                    var textranks = textRank(text, 10);
                    textranks.forEach(function(val) {
                        for (var i = 0; i < keywords.length; ++i) {
                            if (keywords[i].indexOf(val) !== -1) {
                                finalSet.add(keywords[i]);
                                break;
                            }
                        }
                    });
                    if (finalSet.size > 3) {
                        keywords = finalSet;
                    } else {
                        keywords = new Set(keywords);
                    }
                } else {
                    keywords = new Set(keywords);
                }
                if (keywords.size === 0) {
                    var counter = 0;
                    for (var i = 0; counter < 10 && i < test_split.length; i++) {
                        var tmp = test_split[i].trim();
                        if (tmp.length > 3) {
                            counter++;
                            keywords.add(tmp);
                        }
                    }
                }
                keywords.forEach(function(val) {
                    profile.contextKeywords.push({
                        text: val
                    });
                    var offset = paragraphContent.indexOf(val);
                    offsets[val] = [];
                    while (offset !== -1) {
                        offsets[val].push(offset);
                        offset = paragraphContent.indexOf(val, offset + val.length);
                    }
                });
                callback({
                    query: profile,
                    offsets: offsets
                });
            };
            guessLang.detect(paragraphContent, function(lang) {
                if (lang === 'en') {
                    if (typeof id === 'undefined') {
                        id = 1;
                    }
                    if (typeof headline === 'undefined') {
                        headline = "";
                    }
                    var paragraphs = {
                        paragraphs: [{
                            id: id,
                            headline: headline,
                            content: paragraphContent
                        }],
                        language: lang
                    };


                    ner.entitiesAndCategories(paragraphs, function(res) {
                        if (res.status === 'success') {
                            var profile = {
                                contextKeywords: []
                            };
                            var offsets = [];
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
                                offsets[this.key.text] = this.key.offset;
                                if (this.key.text !== mainTopic.text) {
                                    profile.contextKeywords.push({
                                        text: this.key.text,
                                        uri: this.key.entityUri,
                                        type: this.key.type,
                                        isMainTopic: false
                                    });
                                }
                            });
                            if (profile.contextKeywords.length === 0) {
                                fallback(paragraphContent);
                            } else {
                                callback({
                                    query: profile,
                                    offsets: offsets
                                });
                            }
                        } else {
                            fallback(paragraphContent);
                        }
                    });
                } else {
                    fallback(paragraphContent);
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
                    var bottom = top + $(this.elements[0]).parent().height();
                    if ((top <= offset) && (bottom >= $(window).scrollTop())) {
                        //if (offset > top && top > $(window).scrollTop()) {
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
                var event = new CustomEvent('paragraphFocused', {
                    detail: focusedPar
                });
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
        },
        /**
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
                    var event = new CustomEvent('paragraphFocused', {
                        detail: that
                    });
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
                var event = new CustomEvent('paragraphFocused', {
                    detail: focusedPar
                });
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
                    var bottom = top + $(this.elements[0]).parent().height();
                    // if (offset > top && top > $(window).scrollTop()) {
                    if ((top <= offset) && (bottom >= $(window).scrollTop())) {
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
                    if (top < 0) {
                        top -= $(window).height();
                    }
                    //                    if (top < 0) {
                    //                        top = $(window).height();
                    //                    }
                    v1.distance = Math.sqrt(left * left + top * top);
                });
            }
        },
        /**
         * Creates a map of text offsets and corresponding DOM elements of the 
         * paragraph. For each element, the start position in the paragaph's 
         * plaintext representation is provided.
         * @param {Object} paragraph The paragraph.
         * @returns {Array} Array of DOM nodes and corresponding start positions
         * in the paragrahp's Text. The contained Objects consist of two 
         * attributes: 'offset' (the start position) and 'el' (the DOM element).
         */
        getOffsetMap: function(paragraph) {
            var offsets = [];
            var offset = 0;
            var walker = document.createTreeWalker(
                paragraph,
                NodeFilter.SHOW_TEXT
            );
            var node;
            while (node = walker.nextNode()) {
                if (node.nodeValue.length > 0) {
                    offsets.push({
                        offset: offset,
                        el: node
                    });
                    offset += node.nodeValue.length;
                }
            }
            return offsets;
        },
        activateSelectionAugmentation: function(addKeyword, queryFromSelection) {
            var selection = '';

            var img1 = $('<div id="add-ex-aug"></div>')
                .css('position', 'absolute')
                .css('width', '30px')
                .css('height', '30px')
                .css('background-image', "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPcAAAD1CAMAAAC7mpNqAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFAJ9j////3xx38QAAAT9JREFUeNrs3bERgDAMBEGp/6ZJSUjtR9pTAczPRo6okiRJkpRZj77v2aMrw83mzZs3b968efPmzZs3b968efPmzZs3b968eRtuNm/evHnz5s2bN2/e272vf/TS8Moa3qN38+bNmzdv3rx58+bNmzdv3rx58+bNmzdv3rx58+bNmzdv3rx58+bNmzdv3rx58+bNmzdv3rx58+bNmzdv3rx57/ZO+fPIae//7ebNmzdv3rx58+a9wdt7zPubN2/evHnz5s2bN2/evHnz5s2bN2/evHnz5s2bN2/evHnz5s2bN2/evHnz5s2bN2/evHnz5s2bN2/evHnz5s17vHfX6xZ5XynBO2s4b968efPmzZs3b968efPmzZs3b968efPmzdts3rx58+bNmzdv3rx58+bNm/dJ79EnSZIkKbNHgAEAxu6yMayy1K8AAAAASUVORK5CYII=')")
                .css('background-size', 'contain').hide();
            img1.click(function(e) {
                addKeyword(selection);
            });

            var img2 = $('<div id="search-ex-aug"></div>')
                .css('position', 'absolute')
                .css('width', '30px')
                .css('height', '30px')
                .css('background-image', "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPcAAAD1CAMAAAC7mpNqAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFAJ9j////3xx38QAAA1xJREFUeNrsnEuW5CAMBJ33v/Rse56np8pYEkoRqnVhgvAPLHFdBEEQBEEQBEH0DI3+/Y49Oi7AwcY3vvGNb3zjG9/4xje+8Y1vfOMb3/jGN77xjW984xvfgIONb3zjG9/4xje+8Y1vfON7sO9/ZQiO993wYsrv0uc82IG+v8wAHub7Qe7zIN8Ps76H+F7Id5/gey3T3933comDt+8XtR3Ovt9Vtbj6fl3O4+k7oI7J0fd3RJd2gwcf/lFrPcEjG3v6BzffC+20Aw9qK2WwevlebmSH8FTsgr/u9/2mhUbgldjv/77N9+t+FwuP8p1wf3DwnfEYNPAd46oQPMh3zqTGzndUZ7r7zlqq6e47rLtlwkN8B3Z2/4m+qbNF4Am+5cCtXqd58CDm+o7tqatvWYAH+M79at7XtyV3Q9861HeJ8GjfkvuJvq+XHr4vfKdkvZ3jW/h28S184xvf3M/xzfsavpmP9fXN/Jv1FtbXunKzft7ze4mP71O/j53zPdTxOzD5Dh3Sehqc5nsSPS4r34Z5XK3yFVskam7osF9+akiXeyRil/fZMv/8fa+7FFoUd9u1vkSxDwSfeiIFTm02ltVUgu+oEQ2sD11tZkc5dGg98FIzmwrgC+q/F6kd3s/XTtmdez2U7e/wmLn/essjnib7VbXbv6UGPOGA5uApY/kFZA14zji/crsZPGs4P490BXjadfXmQt4KnjiiH4+XD555H31x094InjyqH46VDZ793Fx+QG8Drxja69FWXU6+/3+YjUtuda+HP2ckWluHsfMd1TlH363AW/veAi5NBm/uewO4NBm8ve9ycGkyuIHvYnBpMriF71JwaTK4ie9CcGkyuI3vMnBpMriR7yJwaTK4le8ScGkyuJnvAnBpMrid73RwaTK4oe9kcGkyuKXvVHBpMrip70RwaTK4re80cGkyuLHvJHBpMri17xRwaTK4ue8EcGkyuL3vcHBpMvgA38Hg0mTwEb5DwaXJ4EN8B4JLk8HH+H66o8gY7GebOw3y/Wzj1UHYf8Gc8fy+4ZzxvnbDOeP9/AZ0xnzsBnTG/PuGdMZ6S9Tb3eng+MY3vvGNb3zjG9/4xje+8Y1vfOMb3/jGN77xjW984xvsn3sBDv4RBEEQBEEQBNEz/ggwAEWQrFnOy4REAAAAAElFTkSuQmCC')")
                .css('background-size', 'contain').hide();
            img2.click(function(e) {
                //TODO CHANGE FUNCTION CALL
                addKeyword(selection);
            });
            var img3 = $('<div id="gen-para-ex-aug"></div>')
                .css('position', 'absolute')
                .css('width', '30px')
                .css('height', '30px')
                .css('background-image', "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPcAAAD1CAMAAAC7mpNqAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFAJ9j////3xx38QAAAYFJREFUeNrs3EESwiAQBED8/6d9gVZMVliGHu5WTdrDAtExRERERESkZ17R63Pt6AzF1ebNmzdv3rx58+bNmzdv3rx5r/OuONjaz7vmsHI/76jevHnz5s2bN2/evDO9D9qPZe1SefPmzZs3b968efPmzZs3b968efPmzZs3b968eVd4d/gZ7wrv7Xrz5s2bN2/e5jXzOW/evHnz5s2bN2/evHnz5s2bN+/r53Qd/55igndW1Facd8HHbH9fEtWbN2/evHnzNq+Zz3nz5s2bN2/evHnz5s2bN2/evHkrrjZv3rx/e3zux9yP8ebNm/ez3t/ep032vv5Wee6b1ifNa7x58+bNmzdv3rx58+bNmzdv3rx58+bNm/di7wb3JWOFd/favHnz5s2bt3nNvMabN2/evHnz5s2bN2/evHnz5s2bN+/exSecMrf0/ktv3rx58+bNmzdv3rwfFy9YB+3H7n6JDi3Omzdv3rx58+bNmzdv3rx5z/WOXiIiIiIi0jNvAQYAvE2iCao7QFoAAAAASUVORK5CYII=')")
                .css('background-size', 'contain').hide();
            img3.click(function(e) {
                //TODO CHANGE FUNCTION CALL
                addKeyword(selection);
            });

            $('body').append(img1);
            $('body').append(img2);
            $('body').append(img3);

            $(document).bind('mouseup', function(e) {

                if (window.getSelection().toString() !== '') {

                    var topPos = e.pageY + 10;
                    img1.css('top', topPos).css('left', e.pageX).fadeIn('fast');
                    img2.css('top', topPos).css('left', e.pageX + 30).fadeIn('fast');
                    img3.css('top', topPos).css('left', e.pageX + 60).fadeIn('fast');

                    selection = window.getSelection().toString();

                } else {
                    img1.fadeOut('fast');
                    img2.fadeOut('fast');
                    img3.fadeOut('fast');
                }
            });

        }
    };
});
