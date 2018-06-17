// ==UserScript==
// @name           pixiv_expand_thumbnails
// @name:ja        pixiv_expand_thumbnails
// @name:zh-CN     pixiv_expand_thumbnails
// @namespace      https://greasyfork.org/scripts/5480-pixiv-expand-thumbnails/
// @version        2.1.1
// @description    Expand thumbnails and links to the original pages on pixiv.
// @description:ja pixivのイラストページでサムネイルを各マンガページへ展開します。
// @description:zh-CN 在Pixiv缩略图页面中显示漫画内容。
// @include        https://www.pixiv.net/member_illust.php?mode=medium&illust_id=*
// @include        https://www.pixiv.net/member_illust.php?illust_id=*&mode=medium
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js



// ==/UserScript==


// https://gist.github.com/raw/2625891/waitForKeyElements.js due to unapproval @require
/*--- waitForKeyElements():  A utility function, for Greasemonkey scripts,
    that detects and handles AJAXed content.

    Usage example:

        waitForKeyElements (
            "div.comments"
            , commentCallbackFunction
        );

        //--- Page-specific function to do what we want when the node is found.
        function commentCallbackFunction (jNode) {
            jNode.text ("This comment changed by waitForKeyElements().");
        }

    IMPORTANT: This function requires your script to have loaded jQuery.
*/
function waitForKeyElements (
selectorTxt,    /* Required: The jQuery selector string that
                        specifies the desired element(s).
                    */
 actionFunction, /* Required: The code to run when elements are
                        found. It is passed a jNode to the matched
                        element.
                    */
 bWaitOnce,      /* Optional: If false, will continue to scan for
                        new elements even after the first match is
                        found.
                    */
 iframeSelector  /* Optional: If set, identifies the iframe to
                        search.
                    */
) {
    var targetNodes, btargetsFound;

    if (typeof iframeSelector == "undefined")
        targetNodes     = $(selectorTxt);
    else
        targetNodes     = $(iframeSelector).contents ()
            .find (selectorTxt);

    if (targetNodes  &&  targetNodes.length > 0) {
        btargetsFound   = true;
        /*--- Found target node(s).  Go through each and act if they
            are new.
        */
        targetNodes.each ( function () {
            var jThis        = $(this);
            var alreadyFound = jThis.data ('alreadyFound')  ||  false;

            if (!alreadyFound) {
                //--- Call the payload function.
                var cancelFound     = actionFunction (jThis);
                if (cancelFound)
                    btargetsFound   = false;
                else
                    jThis.data ('alreadyFound', true);
            }
        } );
    }
    else {
        btargetsFound   = false;
    }

    //--- Get the timer-control variable for this selector.
    var controlObj      = waitForKeyElements.controlObj  ||  {};
    var controlKey      = selectorTxt.replace (/[^\w]/g, "_");
    var timeControl     = controlObj [controlKey];

    //--- Now set or clear the timer as appropriate.
    if (btargetsFound  &&  bWaitOnce  &&  timeControl) {
        //--- The only condition where we need to clear the timer.
        clearInterval (timeControl);
        delete controlObj [controlKey]
    }
    else {
        //--- Set a timer, if needed.
        if ( ! timeControl) {
            timeControl = setInterval ( function () {
                waitForKeyElements (    selectorTxt,
                                    actionFunction,
                                    bWaitOnce,
                                    iframeSelector
                                   );
            },
                                       300
                                      );
            controlObj [controlKey] = timeControl;
        }
    }
    waitForKeyElements.controlObj   = controlObj;
}


waitForKeyElements ("figure", expandThumbnail);

function getNpage(containerNode) {
    /*
    <figure>
      <div role=presentation>
        <div>
          <div>                  -- pagenumber
        <div role=presentation>  -- containerNode
      <div>                      -- comment/bookmark
      <figcaption>               -- caption
    */
    return containerNode.previousSibling.firstElementChild.innerText.split('/')[1];
}

function getIllustId() {
    return location.href.split('?')[1].split('&').filter(function (e) {return !e.indexOf('illust_id');})[0].split('=')[1];
}

function expandThumbnail () {
    var nodeFigure = document.querySelectorAll('figure')[0];

    // うごイラだとundefined
    var container = nodeFigure.querySelectorAll('[role="presentation"]')[1];

    if (container) {
        var thumb = container.getElementsByTagName('img')[0];
        var linkNode = thumb.parentNode;

        // イラストだとundefined
        var linkParams = linkNode.href.split('?')[1];

        if (linkParams && !linkParams.indexOf('mode=manga')) {
            var illustId = getIllustId();
            var nPages = getNpage(container);
            if (!nPages) {
                console.debug(nPages, illustId);
            }
            function retrievePages(page, srcs) {
                var request = new XMLHttpRequest();
                var imgSourceLink = 'https://www.pixiv.net/member_illust.php?mode=manga_big&illust_id=' + illustId + '&page=' + page;
                console.debug(imgSourceLink);
                request.open('GET', imgSourceLink);
                request.onreadystatechange = function () {
                    if (request.readyState != 4 || request.status != 200) {
                        return;
                    }
                    var result = document.createElement('span');
                    result.innerHTML = request.responseText;
                    var sourceImgElement = result.getElementsByTagName('img')[0];
                    srcs[page] = sourceImgElement.src;
                    if (page != 0) {
                        retrievePages(page-1, srcs);
                    } else {
                        var html = [], h = -1;
                        for (var i = -1, src; src = srcs[++i]; ) {
                            html[++h] = '<a href="';
                            html[++h] = src;
                            html[++h] = '" target="_blank"><img style="max-width:740px;margin:10px 0 10px;" src="';
                            html[++h] = src;
                            html[++h] = '"/></br></a>';
                        }
                        container.innerHTML = html.join('');
                        var att = document.createAttribute('style');
                        att.value = "display: inline-block;overflow: scroll;text-align:center";
                        container.setAttributeNode(att);
                    }
                };
                request.send(null);
            }
            retrievePages(nPages-1, []);
        }
    }
}
