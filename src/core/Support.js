//根据script查找
maptalks.prefix = '';

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


maptalks.Url = function (prefix) {
    this.prefix = prefix;
    var parts = this.prefix.split('/');
    var hostIndex = 2;
    if (this.prefix.indexOf('http') < 0) {
        hostIndex = 0;
    }
    var hostport = parts[hostIndex];
    var hostParts = hostport.split(':');
    this.host = hostParts[0];
    if (hostParts.length > 1) {
        this.port = hostParts[1];
    } else {
        this.port = 80;
    }
};

maptalks.Url.prototype.getHost = function () {
    return this.host;
};

maptalks.Url.prototype.getPort = function () {
    return this.port;
};
