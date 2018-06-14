// ==UserScript==
// @name           pixiv_expand_thumbnails
// @name:ja        pixiv_expand_thumbnails
// @name:zh-CN     pixiv_expand_thumbnails
// @namespace      https://greasyfork.org/scripts/5480-pixiv-expand-thumbnails/
// @version        2.0.0
// @description    Expand thumbnails and links to the original pages on pixiv.
// @description:ja pixivのイラストページでサムネイルを各マンガページへ展開します。
// @description:zh-CN 在Pixiv缩略图页面中显示漫画内容。
// @include        https://www.pixiv.net/member_illust.php?mode=medium&illust_id=*
// @include        https://www.pixiv.net/member_illust.php?illust_id=*&mode=medium
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @require        https://gist.github.com/raw/2625891/waitForKeyElements.js


// ==/UserScript==


waitForKeyElements ("figure", expandThumbnail);

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
            var illustId = location.href.split('?')[1].split('&').filter(function (e) {return !e.indexOf('illust_id');})[0].split('=')[1];
            var request = new XMLHttpRequest();
            request.open('GET', location.href.replace('mode=medium', 'mode=manga'));
            request.onreadystatechange = function () {
                if (request.readyState != 4 || request.status != 200) {
                    return;
                }
                var result = document.createElement('span');
                result.innerHTML = request.responseText;
                var nPages = result.getElementsByClassName('item-container').length;

                if (!nPages) {
                    //metaNode = container.parentNode.getElementsByClassName('meta')[0];
                    //nPages = +metaNode.childNodes[1].innerHTML.split(' ')[1].replace('P','');
                    console.debug(nPages);
                }
                function retrievePages(page, srcs) {
                    var request = new XMLHttpRequest();
                    var imgSourceLink = 'https://www.pixiv.net/member_illust.php?mode=manga_big&illust_id=' + illustId + '&page=' + page;
                    // console.debug(imgSourceLink);
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
                                html[++h] = '" target="_blank"><img style="max-width:740px;margin:20px 0 0;" src="';
                                html[++h] = src;
                                html[++h] = '"/></a>';
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
            };
            request.send(null);
        }
    }
}
