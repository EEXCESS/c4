/**
 * A module to add a search bar to the bottom of a page. 
 *
 * @module c4/searchBar
 */
define(['jquery', 'jquery-ui', 'tag-it', 'c4/APIconnector', 'c4/iframes', 'c4/QueryCrumbs/querycrumbs'], function($, ui, tagit, api, iframes, qc) {
    var util = {
// flag to determine if queries should be surpressed
        preventQuery: false,
        // flag to determine if changing the query in the searchBar should be supressed
        preventQuerySetting: false,
        // a temporarily stored set of contextKeywords
        cachedQuery: null,
        cachedSubqueries: null,
        setSubQueries: function(subqueries) {
            ui_bar.selectmenu.children('option.subquery').remove();
            ui_bar.selectmenu.children('option:selected').attr('selected', '');
            var notSelected = true;
            ui_bar.selectmenu.children('option').first().data('query', subqueries.full);
            for (var i = 0; i < subqueries.sub.length; i++) {
                var q = subqueries.sub[i];
                var tmp_option = $('<option class="subquery" />').data('query', q.keywords).text(q.topic);
                if (q.score >= subqueries.highestScore && notSelected) {
                    tmp_option.attr('selected', 'selected');
                    notSelected = false;
                }
                tmp_option.appendTo(ui_bar.selectmenu);
            }
        },
        popupTimer: null,
        fadeOutPopup: function(delay) {
            if (typeof delay === 'undefined') {
                delay = 2000;
            }
            clearTimeout(this.popupTimer);
            this.popupTimer = setTimeout(function() {
                ui_bar.popupBubble.fadeOut(2000, function() {
                    ui_bar.popupBubbleClose.hide();
                });
            }, delay);
        },
        highlightTags: function(terms) {
            ui_bar.mainTopicLabel.removeClass('eexcess-tag_hover');
            var mTopic = ui_bar.mainTopicLabel.val().toLowerCase();
            terms.forEach(function(val) {
                if (val.length > 3 && mTopic.indexOf(val.toLowerCase()) !== -1) {
                    ui_bar.mainTopicLabel.addClass('eexcess-tag_hover');
                    var event = new CustomEvent('c4_keywordMouseEnter', {detail: ui_bar.mainTopicLabel.data('properties')});
                    document.dispatchEvent(event);
                }
            });
            var tagset = ui_bar.taglist.tagit('getTagsByLabels', terms);
            tagset.forEach(function(val) {
                var tag = $(val);
                tag.addClass('eexcess-tag_hover');
                var event = new CustomEvent('c4_keywordMouseEnter', {detail: tag.data('properties')});
                document.dispatchEvent(event);
            });
        },
        unhighlightTags: function() {
            ui_bar.mainTopicLabel.removeClass('eexcess-tag_hover');
            var event = new CustomEvent('c4_keywordMouseLeave', {detail: ui_bar.mainTopicLabel.data('properties')});
            document.dispatchEvent(event);
            ui_bar.taglist.tagit('getTags').each(function(idx, val) {
                var tag = $(val);
                var event = new CustomEvent('c4_keywordMouseLeave', {detail: tag.data('properties')});
                tag.removeClass('eexcess-tag_hover');
                document.dispatchEvent(event);
            });
        },
        showPopup: function() {
            clearTimeout(this.popupTimer);
            if (settings.showBubble && !ui_content.contentArea.is(':visible')) {
                ui_bar.popupBubble.show();
                this.fadeOutPopup(3000);
            }
        },
        hidePopup: function() {
            clearTimeout(this.popupTimer);
            ui_bar.popupBubble.hide();
            ui_bar.popupBubbleClose.hide();
        },
        addCategoriesToProfile: function(query) {
            var categories = new Set();
            query.contextKeywords.forEach(function(keyword) {
                if (keyword.hasOwnProperty('categories')) {
                    keyword.categories.forEach(function(category) {
                        categories.add(category);
                    });
                }
            });
            settings.profile.addCategories(Array.from(categories));
        },
        processQuery: function(query, callback) {
            // add categories to profile
            if (ui_content.contentArea.is(':visible')) {
                this.addCategoriesToProfile(query);
            }
            // remove attributes not relevant/known to the recommender
            var cleanedOutput = {
                contextKeywords: [],
                origin: query.origin
            };
            query.contextKeywords.forEach(function(keyword) {
                var newKeyword = {};
                for (var prop in keyword) {
                    if (keyword.hasOwnProperty(prop) && prop !== 'categories' && prop !== 'frequency') {
                        newKeyword[prop] = keyword[prop];
                    }
                }
                cleanedOutput.contextKeywords.push(newKeyword);
            });
            settings.queryFn(cleanedOutput, callback);
        },
        focusBlurDelayTimer: null,
        /**
         * Helper to adjust the size of an input element to its content.
         * ATTENTION: the input element must be set as 'this'-context. Hence,
         * the function need to be executed in the following fashion:
         * resizeForText.call(<input element>,text,minify)
         * 
         * @param {string} text the input's content
         * @param {boolean} minify wheter the input should also scale down or only scale up
         * @returns {undefined}
         */
        resizeForText: function(text, minify) {
            var $this = $(this);
            var $span = $this.parent().find('span');
            $span.text(text);
            var $inputSize = $span.width();
            if ($this.width() < $inputSize || minify) {
                $this.css("width", $inputSize);
            }
        },
        /**
         * Helper to change the UI and send a query when a user made modifications the query. 
         * 
         * Shows the loading animation, hides the indication of results, collects
         * keywords and main topics and after the timeout specified by settings.queryModificationDelay
         * sends the query.
         * @returns {undefined}
         */
        queryUpdater: function() {
            ui_bar.loader.show();
            ui_bar.result_indicator.hide();
            util.hidePopup();
            clearTimeout(timeout);
            timeout = setTimeout(function() {
// get keywords
                lastQuery.contextKeywords = ui_bar.taglist.tagit('getActiveTagsProperties');
                // get main topic
                var mainTopic = ui_bar.mainTopicLabel.data('properties');
                if (mainTopic && mainTopic.text && mainTopic.text !== '') {
                    lastQuery.contextKeywords.push(mainTopic);
                }
// add origin
                lastQuery.origin = {
                    module: "c4/searchBar"
                };
                // query
                util.processQuery(lastQuery, resultHandler);
                if (ui_content.contentArea.is(':visible')) {
                    iframes.sendMsgAll({event: 'eexcess.queryTriggered', data: lastQuery});
                }
            }, settings.queryModificationDelay);
        },
        /**
         * Helper to set the main topic in the search bar.
         * The topic must at least contain the attribute 'text'. 
         * 
         * @param {Object} topic
         * @returns {undefined}
         */
        setMainTopic: function(topic) {
            topic.isMainTopic = true;
            ui_bar.mainTopicLabel.val(topic.text).data('properties', topic);
            util.resizeForText.call(ui_bar.mainTopicLabel, topic.text, true);
        },
        /**
         * Helper to display the provided contextKeywords in the searchBar and automatically
         * trigger a query with them after the delay specified by settings.queryDelay.
         * 
         * @param {array<keyword>} contextKeywords A keyword must look like:
         * {
         *  text:"<textual label>" // the keyword (type:String)
         *  type:"<entity type>" // either person, location, organization, misc (type:String, optional)
         *  uri:"<entity uri" // uri of the entity (type:String, optional)
         *  isMainTopic:"<true,false>" // indicator whether this keyword is the main topic
         * }
         * @returns {undefined}
         */
        setQuery: function(contextKeywords, delay, origin) {
            if (typeof delay === 'undefined') {
                delay = settings.queryDelay;
            }
            util.preventQuery = true;
            ui_bar.taglist.tagit('removeAll');
            ui_bar.mainTopicLabel.val('').data('properties', null);
            ui_bar.mainTopicLabel.css('width', '50px');
            $.each(contextKeywords, function() {
                if (this.isMainTopic) {
// TODO: support multiple topics?
                    util.setMainTopic(this);
                } else {
                    ui_bar.taglist.tagit('createTag', this.text, this);
                }
            });
            // filter keywords according to 'show all', 'persons', 'locations'
            var type = ui_bar.selectmenu.children(':selected').text();
            if (type === 'persons' || type === 'locations') {
                $.each(ui_bar.taglist.tagit('getTags'), function() {
                    if ($(this).data('properties').type && $(this).data('properties').type.toLowerCase() + 's' === type) {
                        $(this).css('opacity', '1.0');
                    } else {
                        $(this).css('opacity', '0.4');
                    }
                });
            } else {
                // TODO: subqueries
                $(ui_bar.taglist.tagit('getTags').css('opacity', '1.0'));
            }
            // height of search bar may have changed, resize popup
            if (popup_dim_pos.control !== 'custom') {
                popup_dim_pos.resize();
            }
            util.preventQuery = false;
            clearTimeout(timeout);
            setTimeout(function() {
                ui_bar.loader.show();
                ui_bar.result_indicator.hide();
                util.hidePopup();
                lastQuery = {contextKeywords: contextKeywords};
                // add origin
                if (typeof origin === 'undefined') {
                    lastQuery.origin = {
                        module: "c4/searchBar"
                    };
                } else {
                    lastQuery.origin = origin;
                }
                if (ui_content.contentArea.is(':visible')) {
                    iframes.sendMsgAll({event: 'eexcess.queryTriggered', data: lastQuery});
                }
                if (origin && origin.module === 'QueryCrumbs') {
                    util.processQuery(lastQuery, function(response) {
                        if (response.status === 'success') {
                            results = response.data;
                            ui_bar.loader.hide();
                            ui_bar.result_indicator.text(response.data.totalResults + ' results');
                            ui_bar.result_indicator.show();
                            if (results.totalResults > 0) {
                                util.showPopup();
                            }
                            if (ui_content.contentArea.is(':visible')) {
                                iframes.sendMsgAll({event: 'eexcess.newResults', data: results});
                            }
                        } else {
                            ui_bar.loader.hide();
                            ui_bar.result_indicator.text('error');
                            ui_bar.result_indicator.show();
                            if (ui_content.contentArea.is(':visible')) {
                                iframes.sendMsgAll({event: 'eexcess.error', data: response.data});
                            }
                        }
                    });
                } else {
                    util.processQuery(lastQuery, resultHandler);
                }
            }, delay);
        }
    };
    var results = {}; // the current results
    var lastQuery = {}; // cache for the query to execute. On interface level, the query may already have changed
    var settings = {
        queryFn: api.query, // function to execute a query
        imgPATH: 'img/',
        queryModificationDelay: 500, // the delay before a query is executed due to changes by the user
        queryDelay: 2000, // the delay before a query is executed due to changes from the parent container
        focusBlurDelay: 1000,
        showBubble: true, // popup bubble for first result indication
        origin: null, // needs to be provided upon initalization
        queryCrumbs: {
            active: false
        },
        storage: {// wrapper for local storage
            set: function(item, callback) {
                for (var key in item) {
                    if (item.hasOwnProperty(key)) {
                        localStorage.setItem(key, JSON.stringify(item[key]));
                    }
                }
                if (typeof callback === 'function') {
                    callback();
                }
            },
            get: function(key, callback) {
                var response = {};
                if (Array.isArray(key)) {
                    key.forEach(function(entry) {
                        response[entry] = JSON.parse(localStorage.getItem(entry));
                    });
                } else {
                    response[key] = JSON.parse(localStorage.getItem(key));
                }
                callback(response);
            }
        },
        profile: function() {
            var db_name = 'eexcess_profile_db';
            var db_version = 1;
            var db = {};
            var CATEGORIES_CONST = 'categories';
            var openDB = function(callback) {
                if (typeof db === 'IDBDatabase') {
                    callback({db: db});
                } else {
                    var req = indexedDB.open(db_name, db_version);
                    // update or create db
                    req.onupgradeneeded = function() {
                        console.log('db upgrade needed');
                        // remove existing object store 'categories' if present
                        if (req.result.objectStoreNames.contains(CATEGORIES_CONST)) {
                            req.result.deleteObjectStore(CATEGORIES_CONST);
                        }
                        // create object store 'resource_relations'
                        var os = req.result.createObjectStore(CATEGORIES_CONST);
                        os.createIndex('frequency', 'frequency');
                    };

                    req.onsuccess = function() {
                        db = req.result;
                        callback({db: db});
                    };

                    req.onerror = function() {
                        callback({error: this});
                    };
                }
            };
            var addCategories = function(categories, callback) {
                if (categories.length === 0) {
                    if (typeof callback !== 'undefined') {
                        callback({error: 'no categories provided'});
                    }
                    return;
                }
                openDB(function(result) {
                    if (result.db) {
                        var tx = result.db.transaction(CATEGORIES_CONST, 'readwrite');
                        var os = tx.objectStore(CATEGORIES_CONST);
                        var i = 0;
                        var handleNext = function() {
                            if (i < categories.length) {
                                var curreq = os.openCursor(categories[i].uri);
                                curreq.onsuccess = function() {
                                    var cursor = curreq.result;
                                    if (cursor) {
                                        // update existing entry
                                        cursor.value.frequency++;
                                        cursor.update(cursor.value);
                                        i++;
                                        handleNext();
                                    } else {
                                        // create new entry
                                        categories[i].frequency = 1;
                                        os.put(categories[i], categories[i].uri).onsuccess = handleNext;
                                        i++;
                                    }
                                };
                            }
                        };
                        handleNext();
                    } else {
                        if (typeof callback !== 'undefined') {
                            callback(result);
                        }
                    }
                });
            };
            var getMatches = function(categories, callback) {
                if (categories.length === 0) {
                    callback({matches: 0});
                    return;
                }
                openDB(function(result) {
                    if (result.db) {
                        var matches = 0;
                        var tx = result.db.transaction(CATEGORIES_CONST);
                        var os = tx.objectStore(CATEGORIES_CONST);
                        var i = 0;
                        var handleNext = function() {
                            if (i < categories.length) {
                                var curreq = os.openCursor(categories[i].uri);
                                curreq.onsuccess = function() {
                                    var cursor = curreq.result;
                                    if (cursor) {
                                        matches++;
                                        i++;
                                        handleNext();
                                    } else {
                                        i++;
                                        handleNext();
                                    }
                                };
                            } else {
                                callback({matches: matches});
                            }
                        };
                        handleNext();
                    } else {
                        callback(result);
                    }
                });
            };
            return {
                addCategories: addCategories,
                getMatches: getMatches
            };
        }()
    };
    var popup_dim_pos = {
        control: 'fullwidth',
        width: null,
        height: null,
        left: null,
        top: null,
        resize: function() {
            var dim = {};
            switch (this.control) {
                case 'custom':
                    if (this.width || this.width === 0) {
                        dim.width = this.width;
                        dim.height = this.height;
                    }
                    if (this.left || this.left === 0) {
                        dim.top = this.top;
                        dim.left = this.left;
                    }
                    break;
                case 'fullheight_right':
                    dim.width = $(window).width() / 2;
                    dim.height = ($(window).height() - ui_bar.bar.height() - 19);
                    dim.left = $(window).width() / 2 - 9;
                    dim.top = 19;
                    break;
                case 'fullheight_left':
                    dim.width = $(window).width() / 2;
                    dim.height = ($(window).height() - ui_bar.bar.height() - 19);
                    dim.left = 0;
                    dim.top = 19;
                    break;
                case 'maximize':
                    dim.width = $(window).width();
                    dim.height = ($(window).height() - ui_bar.bar.height() - 19);
                    dim.left = 0;
                    dim.top = 19;
                    break;
                default:
                    dim.width = $(window).width();
                    dim.height = ($(window).height() - ui_bar.bar.height()) / 2;
                    dim.left = 0;
                    dim.top = ($(window).height() - ui_bar.bar.height()) / 2;
                    break;
            }
            ui_content.$contentArea.css(dim);
            ui_content.$jQueryTabsHeader.css('width', '').css('height', '').css('top', '').css('left', '');
        }
    };
    var ui_bar = {
        bar: null,
        left: null,
        logo: null,
        loader: null,
        result_indicator: null,
        selectmenu: null,
        mainTopicDiv: null,
        mainTopicLabelHidden: null,
        mainTopicDesc: null,
        main: null,
        taglist: null,
        taglistDesc: null,
        right: null,
        window_controls: null,
        popupBubble: null,
        popupBubbleClose: null
    };
    var ui_content = {
        contentArea: null,
        $jQueryTabsHeader: null,
        $iframeCover: null,
        $contentArea: null
    };
    var initBar = function() {
        ui_bar.bar = $('<div id="eexcess_searchBar"></div>');
        ui_bar.left = $('<div id="eexcess_barLeft"></div>');
        // select menu
        ui_bar.selectmenu = $('<select id="eexcess_selectmenu"><option selected="selected">show all</option><option>persons</option><option>locations</option></select>');
        ui_bar.selectmenu.change(function(e) {
            lastQuery = {contextKeywords: []};
            var type = $(this).children(':selected').text();
            if (type === 'persons' || type === 'locations') {
                $.each(ui_bar.taglist.tagit('getTags'), function() {
                    if ($(this).data('properties').type && $(this).data('properties').type.toLowerCase() + 's' === type) {
                        $(this).css('opacity', '1.0');
                    } else {
                        $(this).css('opacity', '0.4');
                    }
                });
            } else {
                $(ui_bar.taglist.tagit('getTags').css('opacity', '1.0'));
                clearTimeout(util.focusBlurDelayTimer);
                util.preventQuerySetting = false;
                util.setQuery($(this).children(':selected').data('query'), 0);
                util.cachedQuery = null;
                util.cachedSubqueries = null;
            }
            util.queryUpdater();
        });
        ui_bar.left.append(ui_bar.selectmenu);
        // main topic
        ui_bar.mainTopicDiv = $('<div id="eexcess_mainTopic"></div>');
        ui_bar.mainTopicDiv.droppable({
            activeClass: "mainTopicDropActive",
            hoverClass: "mainTopicDropHover",
            accept: ".eexcess",
            drop: function(event, ui) {
                var tag = $(ui.draggable[0]).data('properties');
                var old_topic = ui_bar.mainTopicLabel.data('properties');
                util.preventQuery = true;
                ui_bar.taglist.tagit('removeTagByLabel', tag.text);
                util.preventQuery = false;
                util.setMainTopic(tag);
                if (typeof old_topic !== 'undefined' && old_topic.text.length > 0) {
                    ui_bar.taglist.tagit('createTag', old_topic.text, old_topic);
                }
                util.queryUpdater();
            }
        });
        ui_bar.mainTopicLabel = $('<input id="eexcess_mainTopicLabel" />').hover(function(e) {
            var $this = $(this);
            var event = new CustomEvent('c4_keywordMouseEnter', {detail: $this.data('properties')});
            $this.addClass('eexcess-tag_hover');
            document.dispatchEvent(event);
            iframes.sendMsgAll({
                event: 'eexcess.explanation.highlight',
                data: $this.val().split(/[ .?!-:;,]+/)
            });
        }, function(e) {
            var $this = $(this);
            var event = new CustomEvent('c4_keywordMouseLeave', {detail: $this.data('properties')});
            $this.removeClass('eexcess-tag_hover');
            document.dispatchEvent(event);
            iframes.sendMsgAll({
                event: 'eexcess.explanation.unhighlight'
            });
        }).click(function(e) {

            iframes.sendMsgAll({
                event: 'eexcess.results.filter',
                data: $(this).val().split(/[ .?!-:;,]+/)
            });
        });
        ui_bar.mainTopicLabel.on('focus', function() {
            var $this = $(this)
                    .one('mouseup.mouseupSelect', function() {
                $this.select();
                return false;
            })
                    .one('mousedown', function() {
                $this.off('mouseup.mouseupSelect');
            })
                    .select();
        });
        ui_bar.mainTopicLabel.keypress(function(e) {
            var $this = $(this);
            if (e.keyCode === 13) {
                $this.blur();
                util.setMainTopic({text: $this.val()});
                util.queryUpdater();
            } else {
                if (e.which && e.charCode) {
                    var c = String.fromCharCode(e.keyCode | e.charCode);
                    util.resizeForText.call($this, $this.val() + c, false);
                }
            }
        });
        ui_bar.mainTopicDiv.append(ui_bar.mainTopicLabel);
        ui_bar.mainTopicLabelHidden = $('<span style="display:none" class="eexcess_hiddenLabelSpan"></span>');
        ui_bar.mainTopicLabel.after(ui_bar.mainTopicLabelHidden);
        ui_bar.mainTopicDesc = $('<p id="eexcess_mainTopicDesc">main topic</p>');
        ui_bar.mainTopicDiv.append(ui_bar.mainTopicDesc);
        ui_bar.left.append(ui_bar.mainTopicDiv);
        // keywords
        ui_bar.main = $('<div id="eexcess_barMain"></div>');
        ui_bar.taglist = $('<ul id="eexcess_taglist" class="eexcess"></ul>');
        ui_bar.taglist.tagit({
            allowSpaces: true,
            placeholderText: '',
            beforeTagAdded: function(event, ui) {
                $(ui.tag).addClass('eexcess');
                $(ui.tag).draggable({
                    revert: 'invalid',
                    scroll: false,
                    stack: '#eexcess_mainTopic',
                    appendTo: 'body',
                    start: function() {
                        $(this).css('z-index', '100000');
                    },
                    stop: function() {
                        $(this).css('z-index', '99999');
                    }
                });
            },
            afterTagAdded: function(e, ui) {
                ui.tag.find('.ui-icon-close').css('background-image', 'url("' + settings.imgPATH + 'ui-icons_cd0a0a_256x240.png")');
                if (!util.preventQuery) {
                    util.queryUpdater();
                }
                var data = ui.tag.data('properties');
                ui.tag.hover(
                        function() {
                            var event = new CustomEvent('c4_keywordMouseEnter', {detail: data});
                            ui.tag.addClass('eexcess-tag_hover');
                            document.dispatchEvent(event);
                            iframes.sendMsgAll({
                                event: 'eexcess.explanation.highlight',
                                data: data.text.split(/[ .?!-:;,]+/)
                            });
                        },
                        function() {
                            var event = new CustomEvent('c4_keywordMouseLeave', {detail: data});
                            ui.tag.removeClass('eexcess-tag_hover');
                            document.dispatchEvent(event);
                            iframes.sendMsgAll({
                                event: 'eexcess.explanation.unhighlight'
                            });
                        });
                if (popup_dim_pos.control !== 'custom') {
                    popup_dim_pos.resize();
                }
            },
            afterTagRemoved: function(e, ui) {
                if (!util.preventQuery) {
                    util.queryUpdater();
                }
                if (popup_dim_pos.control !== 'custom') {
                    popup_dim_pos.resize();
                }
            },
            onTagClicked: function(e, ui) {
                iframes.sendMsgAll({
                    event: 'eexcess.results.filter',
                    data: ui.tag.text().split(/[ .?!-:;,]+/)
                });
//                if ($(ui.tag[0]).css('opacity') === '0.4') {
//                    $(ui.tag[0]).css('opacity', '1.0');
//                } else {
//                    $(ui.tag[0]).css('opacity', '0.4');
//                }
//                util.queryUpdater();
            }
        });
        ui_bar.main.append(ui_bar.taglist);
        ui_bar.taglistDesc = $('<p id="eexcess_taglistDesc">Drag and Drop keywords to change the main topic, click to (de)activate</p>');
        ui_bar.taglist.after(ui_bar.taglistDesc);
        // right bar pane
        ui_bar.right = $('<div id="eexcess_barRight"></div>');
        ui_bar.window_controls = $('<div id="eexcess_window_controls"></div>').hide();
        var maximize = $('<a href="#" title="maximize popup"><img src="' + settings.imgPATH + 'maximize.png" class="eexcess window_controls" /></a>').click(function(e) {
            e.preventDefault();
            popup_dim_pos.control = 'maximize';
            popup_dim_pos.resize();
            settings.storage.set({'popup_control': 'maximize'});
        });
        var custom = $('<a href="#" title="resize popup to custom dimensions"><img src="' + settings.imgPATH + 'custom.png" class="eexcess window_controls" /></a>').click(function(e) {
            e.preventDefault();
            popup_dim_pos.control = 'custom';
            popup_dim_pos.resize();
            settings.storage.set({'popup_control': 'custom'});
        });
        var fullheight_right = $('<a href="#" title="resize popup to full height - half width, placed right"><img src="' + settings.imgPATH + 'fullheight-right.png" class="eexcess window_controls" /></a>').click(function(e) {
            e.preventDefault();
            popup_dim_pos.control = 'fullheight_right';
            popup_dim_pos.resize();
            settings.storage.set({'popup_control': 'fullheight_right'});
        });
        var fullheight_left = $('<a href="#" title="resize popup to full height - half width, placed left"><img src="' + settings.imgPATH + 'fullheight-left.png" class="eexcess window_controls" /></a>').click(function(e) {
            e.preventDefault();
            popup_dim_pos.control = 'fullheight_left';
            popup_dim_pos.resize();
            settings.storage.set({'popup_control': 'fullheight_left'});
        });
        var fullwidth = $('<a href="#" title="resize popup to full width - half height"><img src="' + settings.imgPATH + 'fullwidth.png" class="eexcess window_controls" /></a>').click(function(e) {
            e.preventDefault();
            popup_dim_pos.control = 'fullwidth';
            popup_dim_pos.resize();
            settings.storage.set({'popup_control': 'fullwidth'});
        });
        ui_bar.window_controls.append([maximize, custom, fullheight_left, fullheight_right, fullwidth]);
        ui_bar.right.append(ui_bar.window_controls);
        ui_bar.logo = $('<img id="eexcess_logo" src="' + settings.imgPATH + 'eexcess_Logo.png" />');
        ui_bar.right.append(ui_bar.logo);
        ui_bar.loader = $('<img id="eexcess_loader" src="' + settings.imgPATH + 'eexcess_loader.gif" />').hide();
        ui_bar.right.append(ui_bar.loader);
        ui_bar.result_indicator = $('<a id="eexcess_result_indicator" href="#">16 results</a>').click(function(e) {
            e.preventDefault();
            util.hidePopup();
            ui_bar.window_controls.show();
            // TODO: handle error indications (i.e. no results are obtained from server e.g.)
            iframes.sendMsgAll({event: 'eexcess.queryTriggered', data: lastQuery});
            iframes.sendMsgAll({event: 'eexcess.newResults', data: results});
            if (!ui_content.contentArea.is(':visible')) {
                ui_content.contentArea.show('fast');
                if (settings.queryCrumbs.active) {
                    qc.addNewQuery(results);
                    if (typeof settings.queryCrumbs.updateTrigger === 'function') {
                        settings.queryCrumbs.updateTrigger();
                    }
                }
                api.sendLog(api.logInteractionType.moduleOpened, {
                    origin: {module: 'c4/searchBar'},
                    content: {
                        name: ui_content.$jQueryTabsHeader.find('li.ui-state-active').children('a').attr('title')
                    }
                });
                util.addCategoriesToProfile(lastQuery);
            }
        }).hide();
        ui_bar.right.append(ui_bar.result_indicator);
        if (settings.queryCrumbs.active) {
            ui_bar.right.css('width', '460px');
            var qc_div = $('<div id="queryCrumbs"></div>');
            ui_bar.right.append(qc_div);
            qc.init(qc_div.get(0), function(query) {
                ui_bar.selectmenu.children('option.subquery').remove();
                util.setQuery(query.profile.contextKeywords, 0, query.origin);
                if (!ui_content.contentArea.is(':visible')) {
                    ui_content.contentArea.show('fast');
                    api.sendLog(api.logInteractionType.moduleOpened, {
                        origin: {module: 'QueryCrumbs'},
                        content: {
                            name: ui_content.$jQueryTabsHeader.find('li.ui-state-active').children('a').attr('title')
                        }
                    });
                }
                if (typeof settings.queryCrumbs.updateTrigger === 'function') {
                    settings.queryCrumbs.updateTrigger();
                }
            }, settings.queryCrumbs.storage);
        }
        // popup bubble
        ui_bar.popupBubbleClose = $('<a id="eexcess_bubble_close"></a>').css('background-image', 'url("' + settings.imgPATH + 'close.png")').hide().click(function(e) {
            util.hidePopup();
        });
        ui_bar.popupBubble = $('<div id="eexcess_bubble">EEXCESS has found related resources</div>').hide().hover(function() {
            $(this).stop();
            $(this).fadeIn(0);
            clearTimeout(util.popupTimer);
            ui_bar.popupBubbleClose.show();
        }, function() {
            util.fadeOutPopup();
        });
        ui_bar.popupBubble.append(ui_bar.popupBubbleClose);
        var bubble_par = $('<p></p>');
        var bubble_chbx = $('<input type="checkbox" id="eexcess_chbx_bubble" />').change(function(e) {
            settings.showBubble = !$('#eexcess_chbx_bubble').prop('checked');
            settings.storage.set({'showPopupBubble': settings.showBubble});
        });
        bubble_par.append(bubble_chbx).append('<label for="eexcess_chbx_bubble">do not show this message again</label>');
        ui_bar.popupBubble.append(bubble_par);
        ui_bar.popupBubble.append('<div id="eexcess_bubble_arrow"></div>');
        $('body').append(ui_bar.popupBubble);

        // whole bar
        ui_bar.bar.append(ui_bar.left, ui_bar.main, ui_bar.right);
        ui_bar.bar.mouseenter(function() {
            clearTimeout(util.focusBlurDelayTimer);
            util.preventQuerySetting = true;
        }).mouseleave(function() {
            util.focusBlurDelayTimer = setTimeout(function() {
                util.preventQuerySetting = false;
                if (util.cachedQuery) {
                    if (util.cachedSubqueries) {
                        util.setSubQueries(util.cachedSubqueries);
                        util.cachedSubqueries = null;
                    } else {
                        ui_bar.selectmenu.children('option.subquery').remove();
                    }
                    util.setQuery(util.cachedQuery);
                    util.cachedQuery = null;
                }
            }, settings.focusBlurDelay);
        });
        $('body').append(ui_bar.bar);

        // set background image for new tag
        var $tag_input = $('#eexcess_searchBar input.ui-widget-content');
        $tag_input.css('background-image', 'url("' + settings.imgPATH + 'plus.png")');
        $tag_input.focus(function(e) {
            $tag_input.css('background-image', 'none');
        });
        $tag_input.blur(function(e) {
            $tag_input.css('background-image', 'url("' + settings.imgPATH + 'plus.png")');
        });
    };
    var initPopup = function(tabs) {
        ui_content.contentArea = $("<div id = 'eexcess-tabBar-contentArea'><div id='eexcess-tabBar-iframeCover'></div><div id='eexcess-tabBar-jQueryTabsHeader'><ul></ul><div id = 'eexcess-tabBar-jQueryTabsContent' class='flex-container intrinsic-container intrinsic-container-ratio' ></div></div></div>").hide();
        $('body').append(ui_content.contentArea);
        ui_content.$jQueryTabsHeader = $("#eexcess-tabBar-jQueryTabsHeader");
        // prevent changes of query while the mouse is over the widget area
        ui_content.$jQueryTabsHeader.mouseenter(function() {
            util.preventQuerySetting = true;
            clearTimeout(util.focusBlurDelayTimer);
        }).mouseleave(function() {
            util.focusBlurDelayTimer = setTimeout(function() {
                util.preventQuerySetting = false;
                if (util.cachedQuery) {
                    if (util.cachedSubqueries) {
                        util.setSubQueries(util.cachedSubqueries);
                        util.cachedSubqueries = null;
                    } else {
                        ui_bar.selectmenu.children('option.subquery').remove();
                    }
                    util.setQuery(util.cachedQuery);
                    util.cachedQuery = null;
                }
            }, settings.focusBlurDelay);
        });
        ui_content.$iframeCover = $("#eexcess-tabBar-iframeCover");
        ui_content.$contentArea = $("#eexcess-tabBar-contentArea");
        // close button
        var $close_button = $('<a id="eexcess_close"></a>').css('background-image', 'url("' + settings.imgPATH + 'close.png")').click(function(e) {
            ui_content.contentArea.hide();
            ui_bar.window_controls.hide();
            api.sendLog(api.logInteractionType.moduleClosed, {
                origin: {module: 'c4/searchBar'},
                content: {
                    name: ui_content.$jQueryTabsHeader.find('li.ui-state-active').children('a').attr('title')
                }
            });
        });
        ui_content.$jQueryTabsHeader.append($close_button);
        // tabs
        tabModel.tabs = tabs;
        var activeTabSet = false;
        var activeModule;
        $.each(tabModel.tabs, function(i, tab) {
            if (tab.icon) {
                var link = $("<a href='#tabs-" + i + "' title='" + tab.name + "'><img src='" + tab.icon + "' /> </a>").css('padding', '0.5em 0.4em 0.3em');
                tab.renderedHead = $("<li></li>").append(link);
            } else {
                tab.renderedHead = $("<li><a href='#tabs-" + i + "' title='" + tab.name + "'>" + tab.name + " </a></li>");
            }
            $("#eexcess-tabBar-jQueryTabsHeader ul").append(tab.renderedHead);
            // add tab content corresponding to tab titles
            if (tab.deferLoading) {
                tab.renderedContent = $("<div id='tabs-" + i + "'></div>");
                $("#eexcess-tabBar-jQueryTabsContent").append(tab.renderedContent);
                tab.renderedHead.click(function() {
                    if (tab.renderedContent.children('iframe').length === 0) {
                        tab.renderedContent.append("<iframe src='" + tab.url + "' />");
                    }
                });
            } else {
                tab.renderedContent = $("<div id='tabs-" + i + "'><iframe src='" + tab.url + "'</div>");
                $("#eexcess-tabBar-jQueryTabsContent").append(tab.renderedContent);
            }
            // log opening/closing module
            tab.renderedHead.click(function() {
                var newModule = ui_content.$jQueryTabsHeader.find('li.ui-state-active').children('a').attr('title');
                if (newModule !== activeModule) {
                    api.sendLog(api.logInteractionType.moduleClosed, {
                        origin: {module: 'c4/searchBar'},
                        content: {
                            name: activeModule
                        }
                    });
                    activeModule = newModule;
                    api.sendLog(api.logInteractionType.moduleOpened, {
                        origin: {module: 'c4/searchBar'},
                        content: {
                            name: activeModule
                        }
                    });
                }
            });
            // following 3 functions derived from jQuery-UI Tabs
            ui_content.$jQueryTabsHeader.tabs().addClass("ui-tabs-vertical ui-helper-clearfix eexcess");
            $('#eexcess-tabBar-jQueryTabsHeader ul').addClass('eexcess');
            $("#jQueryTabsHeader li").removeClass("ui-corner-top").addClass("ui-corner-left");
            ui_content.$jQueryTabsHeader.tabs("refresh");
            // set active tab to the first without deferLoading flag
            if (!tab.deferLoading && !activeTabSet) {
                ui_content.$jQueryTabsHeader.tabs({active: i});
                activeTabSet = true;
            }
            activeModule = ui_content.$jQueryTabsHeader.find('li.ui-state-active').children('a').attr('title');
            ui_content.$iframeCover.hide();
        });
        // adding resize functionality
        ui_content.$jQueryTabsHeader.resizable({
            handles: "all",
            minHeight: 200,
            minWidth: 250,
            alsoResize: [ui_content.$iframeCover, ui_content.$contentArea]
        });
        // adding drag functionality to parent div
        ui_content.$contentArea.draggable({scroll: "true"});
        // on resize or drag start, show iframeCover to allow changes when mouse pointer is entering iframe area
        ui_content.$jQueryTabsHeader.on("resizestart", function(event, ui) {
            ui_content.$iframeCover.show();
        });
        ui_content.$contentArea.on("dragstart", function(event, ui) {
            ui_content.$iframeCover.show();
        });
        //storing new values and hide iframeCover after size has been changed
        ui_content.$jQueryTabsHeader.on("resizestop", function(event, ui) {
            popup_dim_pos.control = 'custom';
            settings.storage.set({'popup_control': 'custom'});
            var heightToStore = ui_content.$jQueryTabsHeader.height();
            var widthToStore = ui_content.$jQueryTabsHeader.width();
            settings.storage.set({'resizeHeight': heightToStore});
            settings.storage.set({'resizeWidth': widthToStore});
            popup_dim_pos.width = widthToStore;
            popup_dim_pos.height = heightToStore;
            //whenever a resize happens, but not a drag, the jQueryHeader position changes in another way than
            // the contentAreas position (due to jquery's alsoResize disregarding top and left). 
            var positionToStoreTop = ui_content.$contentArea.position().top + ui_content.$jQueryTabsHeader.position().top;
            var positionToStoreLeft = ui_content.$contentArea.position().left + ui_content.$jQueryTabsHeader.position().left;
            settings.storage.set({'dragPositionTop': positionToStoreTop});
            settings.storage.set({'dragPositionLeft': positionToStoreLeft});
            popup_dim_pos.top = positionToStoreTop;
            popup_dim_pos.left = positionToStoreLeft;
            ui_content.$iframeCover.hide();
        });
        //storing new values and hide iframeCover after position has been changed
        ui_content.$contentArea.on("dragstop", function(event, ui) {
            popup_dim_pos.control = 'custom';
            settings.storage.set({'popup_control': 'custom'});
            var positionToStoreTop = ui_content.$contentArea.position().top + ui_content.$jQueryTabsHeader.position().top;
            var positionToStoreLeft = ui_content.$contentArea.position().left + ui_content.$jQueryTabsHeader.position().left;
            settings.storage.set({'dragPositionTop': positionToStoreTop});
            settings.storage.set({'dragPositionLeft': positionToStoreLeft});
            popup_dim_pos.top = positionToStoreTop;
            popup_dim_pos.left = positionToStoreLeft;
            ui_content.$iframeCover.hide();
        });
        //sets size and position of the tab area according to previous changes by the user stored in chrome
        // local storage
        settings.storage.get(['resizeHeight', 'resizeWidth', 'dragPositionTop', 'dragPositionLeft', 'popup_control'], function(result) {
            if (result.popup_control) {
                popup_dim_pos.control = result.popup_control;
            }
            if (typeof result.resizeWidth !== 'undefined') {
                // if width is set, height is also
                popup_dim_pos.width = parseFloat(result.resizeWidth);
                popup_dim_pos.height = parseFloat(result.resizeHeight);
            }
            if (typeof result.dragPositionLeft !== 'undefined') {
                // if left is set, top is also
                popup_dim_pos.top = parseFloat(result.dragPositionTop);
                popup_dim_pos.left = parseFloat(result.dragPositionLeft);
            }
            popup_dim_pos.resize();
        });
    };
    var timeout;
    var tabModel = {
        tabs: []
    };
    window.onmessage = function(msg) {
        if (msg.data.event) {
            // visualization has triggered a query -> widgets must be visible
            if (msg.data.event === 'eexcess.queryTriggered') {
                lastQuery = msg.data.data;
                iframes.sendMsgAll({event: 'eexcess.queryTriggered', data: msg.data.data});
                ui_bar.result_indicator.hide();
                util.hidePopup();
                ui_bar.loader.show();
                util.processQuery(lastQuery, function(response) {
                    if (response.status === 'success') {
                        results = response.data;
                        ui_bar.loader.hide();
                        ui_bar.result_indicator.text(response.data.totalResults + ' results');
                        ui_bar.result_indicator.show();
                        if (results.totalResults > 0) {
                            util.showPopup();
                        }
                        iframes.sendMsgAll({event: 'eexcess.newResults', data: results});
                        if (settings.queryCrumbs.active) {
                            qc.addNewQuery(results);
                            if (typeof settings.queryCrumbs.updateTrigger === 'function') {
                                settings.queryCrumbs.updateTrigger();
                            }
                        }
                    } else {
                        iframes.sendMsgAll({event: 'eexcess.error', data: response.data});
                        ui_bar.result_indicator.text('error');
                        ui_bar.result_indicator.show();
                    }
                });
            } else if (msg.data.event === 'eexcess.explanation.highlight') {
                util.highlightTags(msg.data.data);
            } else if (msg.data.event === 'eexcess.explanation.unhighlight') {
                util.unhighlightTags();
            }
        }
        ;
    };
    var resultHandler = function(response) {
        if (response.status === 'success') {
            for (var i = 0; i < tabModel.tabs.length; i++) {
                if (typeof tabModel.tabs[i].deactivate === 'function') {
                    if (tabModel.tabs[i].deactivate(response.data.result)) {
                        var link = $('a.ui-tabs-anchor[title="' + tabModel.tabs[i].name + '"]');
                        link.css('cursor', 'default');
                        link.parent().css('opacity', '0.2');
                        link.attr('title', tabModel.tabs[i].name + tabModel.tabs[i].deactivateMsg);
                    } else {
                        var link = $('a.ui-tabs-anchor[title="' + tabModel.tabs[i].name + tabModel.tabs[i].deactivateMsg + '"]');
                        link.css('cursor', 'pointer');
                        link.parent().css('opacity', '1.0');
                        link.attr('title', tabModel.tabs[i].name);
                    }
                }
            }
            results = response.data;
            ui_bar.loader.hide();
            ui_bar.result_indicator.text(response.data.totalResults + ' results');
            ui_bar.result_indicator.show();
            if (results.totalResults > 0) {
                util.showPopup();
            }
            if (ui_content.contentArea.is(':visible')) {
                iframes.sendMsgAll({event: 'eexcess.newResults', data: results});
                if (settings.queryCrumbs.active) {
                    qc.addNewQuery(results);
                    if (typeof settings.queryCrumbs.updateTrigger === 'function') {
                        settings.queryCrumbs.updateTrigger();
                    }
                }
            }
        } else {
            ui_bar.loader.hide();
            ui_bar.result_indicator.text('error');
            ui_bar.result_indicator.show();
            if (ui_content.contentArea.is(':visible')) {
                iframes.sendMsgAll({event: 'eexcess.error', data: response.data});
            }
        }
    };
    return {
        /**
         * Initialize the searchBar with the set of visualization widgets to display and custom settings (optional). 
         * 
         * @param {array<Tab Object>} tabs the widgets to include. Should look like:
         * {
         *  name:"<name>" // the name of the widget, will be displayed as tab entry
         *  url:"<url>" // the url of the widgets main page, will be included as iframe
         *  icon:"<icon path>" // optional, will be displayed instead of the name
         * }
         * @param {object} [config] Custom settings
         * @returns {undefined}
         */
        init: function(tabs, config) {
            if (typeof config !== 'undefined') {
                settings = $.extend(settings, config);
            }
            settings.storage.get('showPopupBubble', function(result) {
                if (typeof result.showPopupBubble !== 'undefined' && result.showPopupBubble !== null) {
                    settings.showBubble = result.showPopupBubble;
                }
            });
            api.init({origin: settings.origin});
            $(function() {
                initBar();
                initPopup(tabs);
            });
            var resizeTimer;
            $(window).resize(function(e) {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function() {
                    if (popup_dim_pos.control !== 'custom') {
                        popup_dim_pos.resize();
                    }
                }, 200);
            });
        },
        /**
         * Displays the provided contextKeywords in the searchBar and automatically
         * triggers a query with them after the delay specified by settings.queryDelay.
         * 
         * @param {array<keyword>} contextKeywords A keyword must look like:
         * {
         *  text:"<textual label>" // the keyword (type:String)
         *  type:"<entity type>" // either person, location, organization, misc (type:String, optional)
         *  uri:"<entity uri" // uri of the entity (type:String, optional)
         *  isMainTopic:"<true,false>" // indicator whether this keyword is the main topic
         * }
         * @returns {undefined}
         */
        setQuery: function(contextKeywords, immediately) {
            var delayed = function() {
                if (immediately) {
                    clearTimeout(util.focusBlurDelayTimer);
                    util.preventQuerySetting = false;
                    util.setQuery(contextKeywords, 0);
                    util.cachedQuery = null;
                    util.cachedSubqueries = null;
                    ui_bar.selectmenu.children('option.subquery').remove();
                } else {
                    if (util.preventQuerySetting) {
                        util.cachedSubqueries = null;
                        util.cachedQuery = contextKeywords;
                    } else {
                        ui_bar.selectmenu.children('option.subquery').remove();
                        util.cachedQuery = null;
                        util.cachedSubqueries = null;
                        util.setQuery(contextKeywords);
                    }
                }
            };
            if (ui_bar.selectmenu) {
                delayed();
            } else {
                window.setTimeout(delayed, 250);
            }
        },
        /**
         * similar to setQuery, but with multiple queries provided from which the most appropriate (according to some user profile) is selected
         * @param {Object} queries The queries, must look like:
         * {
         *  main: {
         *    contextKeywords:<keywords>, // similar to contextKeywords in setQuery, with additional categories and frequency,
         *    offsets:<offsets of the keywords in the paragraph>
         *  }
         *  subs: [] // array of queries similar to main for each subparagraph
         * }
         * @param {Boolean} immediately Indicator, whether the query should be triggered immediately or after a short delay
         * @returns {undefined}
         */
        setQueries: function(queries, immediately) {
            var contextKeywords;

            var finalQuery = function(subqueries) {
                if (typeof contextKeywords === 'undefined') {
                    contextKeywords = queries.main.contextKeywords;
                }
                if (immediately) {
                    clearTimeout(util.focusBlurDelayTimer);
                    util.preventQuerySetting = false;
                    ui_bar.selectmenu.children('option.subquery').remove();
                    ui_bar.selectmenu.children('option').first().data('query', queries.main.contextKeywords);
                    if (subqueries) {
                        util.setSubQueries(subqueries);
                    }
                    util.setQuery(contextKeywords, 0);
                    util.cachedQuery = null;
                    util.cachedSubqueries = null;
                } else {
                    if (util.preventQuerySetting) {
                        util.cachedQuery = contextKeywords;
                        util.cachedSubqueries = subqueries;
                    } else {
                        ui_bar.selectmenu.children('option.subquery').remove();
                        ui_bar.selectmenu.children('option').first().data('query', queries.main.contextKeywords);
                        if (subqueries) {
                            util.setSubQueries(subqueries);
                        }
                        util.setQuery(contextKeywords);
                    }
                }
            };

            if (queries.subs.length > 1) {
                var highestScore = 0;
                var setQuery = function() {
                    // initialize with all keywords
                    var subqueries = {
                        full: queries.main.contextKeywords,
                        highestScore: 0,
                        sub: []
                    };
                    // add subs
                    var topics = {};
                    var noneSelected = true;
                    queries.subs.forEach(function(query) {
                        var topicToDisplay = '';
                        for (var i = 0; i < query.contextKeywords.length; i++) {
                            if (query.contextKeywords[i].isMainTopic) {
                                topicToDisplay = query.contextKeywords[i].text;
                                if (topics.hasOwnProperty(topicToDisplay)) {
                                    topics[topicToDisplay]++;
                                    topicToDisplay += ' #' + topics[topicToDisplay];
                                } else {
                                    topics[topicToDisplay] = 1;
                                }
                                break;
                            }
                        }
                        subqueries.sub.push({topic: topicToDisplay, keywords: query.contextKeywords, score: query.score});
                        if (query.score > subqueries.highestScore) {
                            subqueries.highestScore = query.score;
                            contextKeywords = query.contextKeywords;
                        }
                        // TODO: remove
//                        var tmp = $('<option/>').text(topicToDisplay).data('query', query.contextKeywords).appendTo(ui_bar.selectQuery);
                    });
                    finalQuery(subqueries);
                };
                // calculate scores
                var i = 0;
                var calculateScore = function() {
                    if (i < queries.subs.length) {
                        // obtain category set
                        var categories = new Set();
                        queries.subs[i].contextKeywords.forEach(function(keyword) {
                            if (keyword.hasOwnProperty('categories')) {
                                keyword.categories.forEach(function(category) {
                                    categories.add(category);
                                });
                            }
                        });
                        // set score according to portion of matched categories
                        settings.profile.getMatches(Array.from(categories), function(result) {
                            if (result.matches) {
                                queries.subs[i].score = result.matches / categories.size;
                                if (queries.subs[i].score > highestScore) {
                                    highestScore = queries.subs[i].score;
                                }
                            } else {
                                queries.subs[i].score = 0;
                            }
                            i++;
                            calculateScore();
                        });
                    } else {
                        // score calculation finished, move on
                        setQuery();
                    }
                };
                calculateScore();
            } else {
                finalQuery();
            }
        },
        /**
         * Refresh QueryCrums if active
         */
        refreshQC: function() {
            if (settings.queryCrumbs.active) {
                qc.refresh();
            }
        },
        addKeyword: function(keyword) {
            util.preventQuery = true;
            ui_bar.taglist.tagit('createTag', keyword.text, keyword);
            util.preventQuery = false;
            util.queryUpdater();
        },
        getCurrentModule: function() {

            if (ui_content.contentArea && ui_content.contentArea.is(':visible')) {
                return ui_content.$jQueryTabsHeader.find('li.ui-state-active').children('a').attr('title');
            } else {
                return null;
            }
        },
        showNotificationBubble: function(show) {
            settings.showBubble = show;
            $('#eexcess_chbx_bubble').prop('checked', !show);
        },
        highlightTags: function(terms) {
            util.highlightTags(terms);
        },
        setMainTopic: function(maintopic) {
            util.preventQuery = true;
            util.setMainTopic(maintopic);
            util.preventQuery = false;
            util.queryUpdater();
        }
    };
});