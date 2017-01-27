// ==UserScript==
// @name           pixiv_expand_thumbnails
// @name:ja        pixiv_expand_thumbnails
// @name:zh-CN     pixiv_expand_thumbnails
// @namespace      https://greasyfork.org/scripts/5480-pixiv-expand-thumbnails/
// @version        1.3.9
// @description    Expand thumbnails and links to the original illusts and pages on pixiv.
// @description:ja pixivのイラストページでサムネイルをオリジナルのイラストや各マンガページへ展開します。
// @description:zh-CN 在Pixiv缩略图页面中显示插图原图或漫画内容。
// @include        http://www.pixiv.net/member_illust.php?mode=medium&illust_id=*
// ==/UserScript==

var container = document.getElementsByClassName('works_display')[0];
var thumb = container.getElementsByTagName('img')[0];
var linkNode = thumb.parentNode.parentNode;
var illustNode = document.getElementsByClassName('_illust_modal _layout-thumbnail')[0];
var mangaIllustNode = document.getElementsByClassName(' _work manga ')[0];
var originalImageNode = document.getElementsByClassName('original-image')[0];

if (illustNode) {
    var imgNode = document.createElement('img');
    var bigNode = document.getElementsByClassName('big')[0];
    imgSrc = bigNode.dataset['src'];
    imgNode.src = imgSrc
    imgNode.style.maxWidth = '600px';
    var html='<a target="_blank" href="';
    html += imgNode.src;
    html += '">';
    html += imgNode.outerHTML;
    html += '</a>';
    container.innerHTML = html;
} else if (mangaIllustNode && !mangaIllustNode.classList.contains('multiple')) {
    var request = new XMLHttpRequest();
    request.open('GET', location.href.replace('mode=medium', 'mode=big'));
    request.onreadystatechange = function () {
    if (request.readyState != 4 || request.status != 200) {
        return;
    }
    var result = document.createElement('span');
    result.innerHTML = request.responseText;
    var imgNode = document.createElement('img');
    imgNode.src = result.getElementsByTagName('img')[0].src
    imgNode.style.maxWidth = '600px';
    var html='<a target="_blank" href="';
    html += imgNode.src;
    html += '">';
    html += imgNode.outerHTML;
    html += '</a>';
    container.innerHTML = html;
    }
    request.send(null);
} else if (originalImageNode) {
    var imgNode = document.createElement('img');
	imgNode.src = originalImageNode.dataset['src'];
    imgNode.style.maxWidth = '600px';
	var html='<a target="_blank" href="';
	html += imgNode.src;
	html += '">';
	html += imgNode.outerHTML;
	html += '</a>';
    container.innerHTML = html;
}
else {
    var linkParams = linkNode.href.split('?')[1];
    if (!linkParams.indexOf('mode=manga')) {
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
                metaNode = container.parentNode.getElementsByClassName('meta')[0];
                nPages = +metaNode.childNodes[1].innerHTML.split(' ')[1].replace('P','');
            }
            function retrievePages(page, srcs) {
                var request = new XMLHttpRequest();
                request.open('GET', 'http://www.pixiv.net/member_illust.php?mode=manga_big&illust_id=' + illustId + '&page=' + page);
                request.onreadystatechange = function () {
                    if (request.readyState != 4 || request.status != 200) {
                        return;
                    }
                    var result = document.createElement('span');
                    result.innerHTML = request.responseText;
                    srcs[page] = result.getElementsByTagName('img')[0].src;
                    if (page != 0) {
                        retrievePages(page-1, srcs);
                    } else {
                        var html = [], h = -1;
                        html[++h] = '<a href="';
                        html[++h] = linkNode.href;
                        html[++h] = '" target="_blank">';
                        html[++h] = thumb.title;
                        html[++h] = '</a>';
                        for (var i = -1, src; src = srcs[++i]; ) {
                            html[++h] = '<br/><a href="';
                            html[++h] = src;
                            html[++h] = '"><img style="max-width:600px;margin:20px 0 0;" src="';
                            html[++h] = src;
                            html[++h] = '"/></a>';
                        }
                        container.innerHTML = html.join('');
                    }
                }
                request.send(null);
            }
            retrievePages(nPages-1, []);
        };
        request.send(null);
    }
}
