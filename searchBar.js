define(['jquery'], function($) {
    var contentArea = $('<iframe src="' + chrome.extension.getURL('visualization-widgets/SearchResultList/index.html') + '" style="position:fixed;width:60%;height:60%;bottom:20px;right:0px;background-color:white;border:1px solid black;z-index:99999"></div>').hide();
    $('body').append(contentArea);
    var bar = $('<div style="position:fixed;width:100%;height:20px;padding:5px;bottom:0;background-color:black;text-align:left;z-index:99999;"></div>');
    var form = $('<form style="display:inline;"><input id="eexcess_search" type="text" size="20" /><input type="submit" /></form>');
    var toggler = $('<a href="#" style="float:right;color:white;margin-right:10px;">&uArr;</a>');
    return {
        init: function(triggerFunction) {
            $(function() {
                form.submit(function(evt) {
                    evt.preventDefault();
                    var profile = {
                        contextKeywords: [{text: $('#eexcess_search').val(), weight: 1}]
                    };
                    triggerFunction(profile);
                });
                bar.append(form);
                toggler.click(function(e) {
                    e.preventDefault();
                    if ($(this).text() === $("<div>").html("&uArr;").text()) {
                        $(this).text($("<div>").html("&dArr;").text());
                    } else {
                        $(this).text($("<div>").html("&uArr;").text());
                    }
                    contentArea.slideToggle('fast');
                });
                bar.append(toggler);
                $('body').append(bar);
            });
        },
        show: function() {
            if (!contentArea.is(':visible')) {
                toggler.click();
            }
        }
    };
});