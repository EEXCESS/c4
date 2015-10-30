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
            loader.show();
            result_indicator.hide();
            clearTimeout(timeout);
            timeout = setTimeout(function() {
// get keywords
                lastQuery.contextKeywords = taglist.tagit('getActiveTagsProperties');
                // get main topic
                var mainTopic = mainTopicLabel.data('properties');
                if (mainTopic && mainTopic.text && mainTopic.text !== '') {
                    lastQuery.contextKeywords.push(mainTopic);
                }
// add origin
                lastQuery.origin = {
                    module: "c4/searchBar"
                };
                // query
                settings.queryFn(lastQuery, resultHandler);
                if (contentArea.is(':visible')) {
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
            mainTopicLabel.val(topic.text).data('properties', topic);
            this.resizeForText.call(mainTopicLabel, topic.text, true);
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
            taglist.tagit('removeAll');
            mainTopicLabel.val('').data('properties', undefined);
            this.resizeForText.call(mainTopicLabel,'', true);
            $.each(contextKeywords, function() {
                if (this.isMainTopic) {
// TODO: support multiple topics?
                    util.setMainTopic(this);
                } else {
                    taglist.tagit('createTag', this.text, this);
                }
            });
            util.preventQuery = false;
            clearTimeout(timeout);
            setTimeout(function() {
                loader.show();
                result_indicator.hide();
                lastQuery = {contextKeywords: contextKeywords};
                // add origin
                if (typeof origin === 'undefined') {
                    lastQuery.origin = {
                        module: "c4/searchBar"
                    };
                } else {
                    lastQuery.origin = origin;
                }
                if (contentArea.is(':visible')) {
                    iframes.sendMsgAll({event: 'eexcess.queryTriggered', data: lastQuery});
                }
                if (origin && origin.module === 'QueryCrumbs') {
                    settings.queryFn(lastQuery, function(response) {
                        if (response.status === 'success') {
                            results = response.data;
                            loader.hide();
                            result_indicator.text(response.data.totalResults + ' results');
                            result_indicator.show();
                            if (contentArea.is(':visible')) {
                                iframes.sendMsgAll({event: 'eexcess.newResults', data: results});
                            }
                        } else {
                            loader.hide();
                            result_indicator.text('error');
                            result_indicator.show();
                        }
                    });
                } else {
                    settings.queryFn(lastQuery, resultHandler);
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
        queryCrumbs: {
            active: false
        },
        storage: {// wrapper for local storage
            set: function(item, callback) {
                for (var key in item) {
                    if (item.hasOwnProperty(key)) {
                        localStorage.setItem(key, item[key]);
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
                        response[entry] = localStorage.getItem(entry);
                    });
                } else {
                    response[key] = localStorage.getItem(key);
                }
                callback(response);
            }
        }
    };
    var bar;
    var left;
    var logo;
    var loader;
    var result_indicator;
    var timeout;
    var selectmenu;
    var mainTopicDiv;
    var mainTopicLabel;
    var mainTopicLabelHidden;
    var mainTopicDesc;
    var main;
    var taglist;
    var taglistDesc;
    var right;
    var contentArea;
    var $jQueryTabsHeader;
    var $iframeCover;
    var $contentArea;
    var tabModel = {
        tabs: []
    };
    window.onmessage = function(msg) {
// visualization has triggered a query -> widgets must be visible
        if (msg.data.event && msg.data.event === 'eexcess.queryTriggered') {
            lastQuery = msg.data.data;
            iframes.sendMsgAll({event: 'eexcess.queryTriggered', data: msg.data.data});
            result_indicator.hide();
            loader.show();
            settings.queryFn(lastQuery, function(response) {
                if (response.status === 'success') {
                    results = response.data;
                    loader.hide();
                    result_indicator.text(response.data.totalResults + ' results');
                    result_indicator.show();
                    iframes.sendMsgAll({event: 'eexcess.newResults', data: results});
                    if (settings.queryCrumbs.active) {
                        qc.addNewQuery(results);
                        if (typeof settings.queryCrumbs.updateTrigger === 'function') {
                            settings.queryCrumbs.updateTrigger();
                        }
                    }
                } else {
                    iframes.sendMsgAll({event: 'eexcess.error', data: response.data});
                    result_indicator.text('error');
                    result_indicator.show();
                }
            });
        }
// TODO: handle other events?
    };
    var resultHandler = function(response) {
        if (response.status === 'success') {
            results = response.data;
            loader.hide();
            result_indicator.text(response.data.totalResults + ' results');
            result_indicator.show();
            if (contentArea.is(':visible')) {
                iframes.sendMsgAll({event: 'eexcess.newResults', data: results});
                if (settings.queryCrumbs.active) {
                    qc.addNewQuery(results);
                    if (typeof settings.queryCrumbs.updateTrigger === 'function') {
                        settings.queryCrumbs.updateTrigger();
                    }
                }
            }
        } else {
            loader.hide();
            result_indicator.text('error');
            result_indicator.show();
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
            bar = $('<div id="eexcess_searchBar"></div>');
            left = $('<div id="eexcess_barLeft"></div>');
            selectmenu = $('<select id="eexcess_selectmenu"><option selected="selected">All</option><option>Persons</option><option>Locations</option></select>');
            selectmenu.change(function(e) {
                lastQuery = {contextKeywords: []};
                var type = $(this).children(':selected').text().toLowerCase();
                if (type !== 'all') {
                    $.each(taglist.tagit('getTags'), function() {
                        if ($(this).data('properties').type && $(this).data('properties').type.toLowerCase() + 's' === type) {
                            $(this).css('opacity', '1.0');
                        } else {
                            $(this).css('opacity', '0.4');
                        }
                    });
                } else {
                    $(taglist.tagit('getTags').css('opacity', '1.0'));
                }
                util.queryUpdater();
            });
            left.append(selectmenu);
            mainTopicDiv = $('<div id="eexcess_mainTopic"></div>');
            mainTopicDiv.droppable({
                activeClass: "mainTopicDropActive",
                hoverClass: "mainTopicDropHover",
                accept: ".eexcess",
                drop: function(event, ui) {
                    var tag = $(ui.draggable[0]).data('properties');
                    var old_topic = mainTopicLabel.data('properties');
                    util.preventQuery = true;
                    taglist.tagit('removeTagByLabel', tag.text);
                    util.preventQuery = false;
                    taglist.tagit('createTag', old_topic.text, old_topic);
                    util.setMainTopic(tag);
                    util.queryUpdater();
                }
            });
            left.append(mainTopicDiv);
            mainTopicLabel = $('<input id="eexcess_mainTopicLabel" />');
            mainTopicLabel.on('focus', function() {
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
            mainTopicLabel.keypress(function(e) {
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
            mainTopicDiv.append(mainTopicLabel);
            mainTopicLabelHidden = $('<span style="display:none" class="eexcess_hiddenLabelSpan"></span>');
            mainTopicLabel.after(mainTopicLabelHidden);
            mainTopicDesc = $('<p id="eexcess_mainTopicDesc">main topic</p>');
            mainTopicDiv.append(mainTopicDesc);
            main = $('<div id="eexcess_barMain"></div>');
            taglist = $('<ul id="eexcess_taglist" class="eexcess"></ul>');
            taglist.tagit({
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
                            },
                            function() {
                                var event = new CustomEvent('c4_keywordMouseLeave', {detail: data});
                                ui.tag.removeClass('eexcess-tag_hover');
                                document.dispatchEvent(event);
                            });
                },
                afterTagRemoved: function(e, ui) {
                    if (!util.preventQuery) {
                        util.queryUpdater();
                    }
                },
                onTagClicked: function(e, ui) {
                    if ($(ui.tag[0]).css('opacity') === '0.4') {
                        $(ui.tag[0]).css('opacity', '1.0');
                    } else {
                        $(ui.tag[0]).css('opacity', '0.4');
                    }
                    util.queryUpdater();
                }
            });
            main.append(taglist);
            taglistDesc = $('<p id="eexcess_taglistDesc">Drag and Drop keywords to change the main topic, click to (de)activate</p>');
            taglist.after(taglistDesc);
            right = $('<div id="eexcess_barRight"></div>');
            bar.append(left, main, right);
            $('body').append(bar);
            // set background image for new tag
            var $tag_input = $('#eexcess_searchBar input.ui-widget-content');
            $tag_input.css('background-image', 'url("' + settings.imgPATH + 'plus.png")');
            $tag_input.focus(function(e) {
                $tag_input.css('background-image', 'none');
            });
            $tag_input.blur(function(e) {
                $tag_input.css('background-image', 'url("' + settings.imgPATH + 'plus.png")');
            });
            contentArea = $("<div id = 'eexcess-tabBar-contentArea'><div id='eexcess-tabBar-iframeCover'></div><div id='eexcess-tabBar-jQueryTabsHeader'><ul></ul><div id = 'eexcess-tabBar-jQueryTabsContent' class='flex-container intrinsic-container intrinsic-container-ratio' ></div></div></div>").hide();
            $('body').append(contentArea);
            $jQueryTabsHeader = $("#eexcess-tabBar-jQueryTabsHeader");
            // prevent changes of query while the mouse is over the widget area
            $jQueryTabsHeader.mouseenter(function() {
                util.preventQuerySetting = true;
            }).mouseleave(function() {
                util.preventQuerySetting = false;
                if (util.cachedQuery) {
                    util.setQuery(util.cachedQuery);
                    util.cachedQuery = null;
                }
            });
            $iframeCover = $("#eexcess-tabBar-iframeCover");
            $contentArea = $("#eexcess-tabBar-contentArea");
            logo = $('<img id="eexcess_logo" src="' + settings.imgPATH + 'eexcess_Logo.png" />');
            right.append(logo);
            loader = $('<img id="eexcess_loader" src="' + settings.imgPATH + 'eexcess_loader.gif" />').hide();
            right.append(loader);
            result_indicator = $('<a id="eexcess_result_indicator" href="#">16 results</a>').click(function(e) {
                e.preventDefault();
                iframes.sendMsgAll({event: 'eexcess.queryTriggered', data: lastQuery});
                iframes.sendMsgAll({event: 'eexcess.newResults', data: results});
                if (!contentArea.is(':visible')) {
                    contentArea.show('fast');
                    if (settings.queryCrumbs.active) {
                        qc.addNewQuery(results);
                        if (typeof settings.queryCrumbs.updateTrigger === 'function') {
                            settings.queryCrumbs.updateTrigger();
                        }
                    }
                }
            }).hide();
            right.append(result_indicator);
            if (settings.queryCrumbs.active) {
                right.css('width', '460px');
                var qc_div = $('<div id="queryCrumbs"></div>');
                right.append(qc_div);
                qc.init(qc_div.get(0), function(query) {
                    util.setQuery(query.profile.contextKeywords, 0, query.origin);
                    if (!contentArea.is(':visible')) {
                        contentArea.show('fast');
                    }
                    if (typeof settings.queryCrumbs.updateTrigger === 'function') {
                        settings.queryCrumbs.updateTrigger();
                    }
                }, settings.queryCrumbs.storage);
            }

// close button
            var $close_button = $('<a id="eexcess_close"></a>').css('background-image', 'url("' + settings.imgPATH + 'close.png")').click(function(e) {
                contentArea.hide();
            });
            $jQueryTabsHeader.append($close_button);
            tabModel.tabs = tabs;
            $.each(tabModel.tabs, function(i, tab) {
                if (tab.icon) {
                    var link = $("<a href='#tabs-" + i + "' title='" + tab.name + "'><img src='" + tab.icon + "' /> </a>").css('padding', '0.5em 0.4em 0.3em');
                    tab.renderedHead = $("<li></li>").append(link);
                } else {
                    tab.renderedHead = $("<li><a href='#tabs-" + i + "' title='" + tab.name + "'>" + tab.name + " </a></li>");
                }
                $("#eexcess-tabBar-jQueryTabsHeader ul").append(tab.renderedHead);
                // add tab content corresponding to tab titles
                tab.renderedContent = $("<div id='tabs-" + i + "'><iframe src='" + tab.url + "'</div>");
                $("#eexcess-tabBar-jQueryTabsContent").append(tab.renderedContent);
                // following 3 functions derived from jQuery-UI Tabs
                $jQueryTabsHeader.tabs().addClass("ui-tabs-vertical ui-helper-clearfix eexcess");
                $('#eexcess-tabBar-jQueryTabsHeader ul').addClass('eexcess');
                $("#jQueryTabsHeader li").removeClass("ui-corner-top").addClass("ui-corner-left");
                $jQueryTabsHeader.tabs("refresh");
                $jQueryTabsHeader.tabs({active: 0});
                $iframeCover.hide();
            });
            // adding resize functionality
            $jQueryTabsHeader.resizable({
                handles: "all",
                minHeight: 200,
                minWidth: 250,
                alsoResize: [$iframeCover, $contentArea]
            });
            // adding drag functionality to parent div
            $contentArea.draggable({scroll: "true"});
            // on resize or drag start, show iframeCover to allow changes when mouse pointer is entering iframe area
            $jQueryTabsHeader.on("resizestart", function(event, ui) {
                $iframeCover.show();
            });
            $contentArea.on("dragstart", function(event, ui) {
                $iframeCover.show();
            });
            //storing new values and hide iframeCover after size has been changed
            $jQueryTabsHeader.on("resizestop", function(event, ui) {
                var heightToStore = $jQueryTabsHeader.height();
                var widthToStore = $jQueryTabsHeader.width();
                settings.storage.set({'resizeHeight': heightToStore});
                settings.storage.set({'resizeWidth': widthToStore});
                //whenever a resize happens, but not a drag, the jQueryHeader position changes in another way than
                // the contentAreas position (due to jquery's alsoResize disregarding top and left). 
                var positionToStoreTop = $contentArea.position().top + $jQueryTabsHeader.position().top;
                var positionToStoreLeft = $contentArea.position().left + $jQueryTabsHeader.position().left;
                settings.storage.set({'dragPositionTop': positionToStoreTop});
                settings.storage.set({'dragPositionLeft': positionToStoreLeft});
                $iframeCover.hide();
            });
            //storing new values and hide iframeCover after position has been changed
            $contentArea.on("dragstop", function(event, ui) {
                var positionToStoreTop = $contentArea.position().top + $jQueryTabsHeader.position().top;
                var positionToStoreLeft = $contentArea.position().left + $jQueryTabsHeader.position().left;
                settings.storage.set({'dragPositionTop': positionToStoreTop});
                settings.storage.set({'dragPositionLeft': positionToStoreLeft});
                $iframeCover.hide();
            });
            //sets size and position of the tab area according to previous changes by the user stored in chrome
            // local storage
            $(function setSizeAndPosition() {
                settings.storage.get(['resizeHeight', 'resizeWidth', 'dragPositionTop', 'dragPositionLeft'], function(result) {
                    var dim = {};
                    if (result.resizeWidth) {
// if width is set, height is also
                        dim.width = result.resizeWidth + 'px';
                        dim.height = result.resizeHeight + 'px';
                    }
                    if (result.dragPositionLeft) {
// if left is set, top is also
                        dim.left = result.dragPositionLeft + 'px';
                        dim.top = result.dragPositionTop + 'px';
                    }
                    $contentArea.css(dim);
                });
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
        setQuery: function(contextKeywords) {
            if (util.preventQuerySetting) {
                util.cachedQuery = contextKeywords;
            } else {
                util.setQuery(contextKeywords, 0);
            }
        },
        /**
         * Refresh QueryCrums if active
         */
        refreshQC: function() {
            if (settings.queryCrumbs.active) {
                qc.refresh();
            }
        }
    };
});



