if (!maptalks.node) {
    (function () {
        //解析host地址，插入css和vml定义
        var head = document.getElementsByTagName('head')[0];

        var headChildren = head.childNodes;
        var viewPortMeta = null;
        for (var i = 0, len = headChildren.length; i < len; i++) {
            if (headChildren[i].nodeName.toLowerCase() === 'meta') {
                var metaName = (headChildren[i].getAttribute ? headChildren[i].getAttribute('name') : null);
                if (metaName === 'viewport') {
                    viewPortMeta = headChildren[i];
                }
            }
        }

        if (maptalks.Browser.mobile) {
            if (viewPortMeta === null) {
                viewPortMeta = document.createElement('meta');
                viewPortMeta.setAttribute('name', 'viewport');
                viewPortMeta.setAttribute('content', 'user-scalable=no');
                head.appendChild(viewPortMeta);
            } else {
                var viewPortContent = viewPortMeta.getAttribute('content');
                if (viewPortContent.indexOf('user-scalable=no') < 0) {
                    viewPortMeta.setAttribute('content', viewPortContent + ',user-scalable=no');
                }
            }
        }

        if (maptalks.Browser.ielt9) {
            //chrome frame meta标签
            var cfMeta = document.createElement('meta');
            cfMeta.setAttribute('http-equiv', 'X-UA-Compatible');
            cfMeta.setAttribute('content', 'IE=edge,chrome=1');
            head.appendChild(cfMeta);
        }
    })();
}
