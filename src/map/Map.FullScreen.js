Z.Map.include({
    /**
     * 全屏地图
     * @member maptalks.Map
     * @expose
     */
    requestFullScreen: function() {
        this._fireEvent('fullscreenstart');
        this._requestFullScreen(this._containerDOM);
        this._fireEvent('fullscreenend');
    },

    /**
     * 退出全屏地图
     * @member maptalks.Map
     * @expose
     */
    cancelFullScreen: function() {
        this._cancelFullScreen(this._containerDOM);
    },

    _requestFullScreen: function(dom) {
        if(dom.requestFullScreen) {
            dom.requestFullScreen();
        } else if(dom.mozRequestFullScreen) {
            dom.mozRequestFullScreen();
        } else if(dom.webkitRequestFullScreen) {
            dom.webkitRequestFullScreen();
        } else if(dom.msRequestFullScreen) {
            dom.msRequestFullScreen();
        } else {
            var features = 'fullscreen=1,status=no,resizable=yes,top=0,left=0,scrollbars=no,'+
                'titlebar=no,menubar=no,location=no,toolbar=no,z-look=yes,'+
                'width='+(screen.availWidth-8)+',height='+(screen.availHeight-45);
            var newWin = window.open(location.href,'_blank',features);
            if(newWin !== null){
                window.opener = null;
                //关闭父窗口
                window.close();
            }
        }
     },

     _cancelFullScreen: function(dom) {
       if(document.cancelFullScreen) {
         document.cancelFullScreen();
       } else if(document.mozCancelFullScreen) {
         document.mozCancelFullScreen();
       } else if(document.webkitCancelFullScreen) {
         document.webkitCancelFullScreen();
       } else {
            var features = 'fullscreen=no,status=yes,resizable=yes,scrollbars=no,'+
                'titlebar=no,menubar=yes,location=yes,toolbar=yes,z-look=yes';
            var newWin = window.open(location.href,'_blank',features);
            if(newWin !== null){
                window.opener = null;
                //关闭父窗口
                window.close();
            }
        }
     }
});
