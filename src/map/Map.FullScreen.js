import Map from './Map';

Map.include(/** @lends Map.prototype */ {
    /**
     * @return {Boolean} Element is currently in fullscreen.
     */
    isFullScreen() {
        return !!(
            document.webkitIsFullScreen || document.mozFullScreen ||
            document.msFullscreenElement || document.fullscreenElement
        );
    },

    /**
     * Request for the full screen
     * @property {Object} dom -containerDOM to requestFullScreen
     * @return {Map} this
     * @fires Map#fullscreenstart
     * @fires Map#fullscreenend
     */
    requestFullScreen(dom) {
        /**
         * fullscreenstart event
         * @event Map#fullscreenstart
         * @type {Object}
         * @property {String} type                    - fullscreenstart
         * @property {Map} target            - the map fires event
         */
        this._fireEvent('fullscreenstart');
        this._requestFullScreen(dom || this._containerDOM);
        /**
         * fullscreenend event
         * @event Map#fullscreenend
         * @type {Object}
         * @property {String} type                    - fullscreenend
         * @property {Map} target            - the map fires event
         */
        this._fireEvent('fullscreenend');
        return this;
    },

    /**
     * Cancel full screen
     * @return {Map} this
     * @fires Map#cancelfullscreen
     */
    cancelFullScreen() {
        this._cancelFullScreen();
        /**
         * cancelfullscreen event
         * @event Map#cancelfullscreen
         * @type {Object}
         * @property {String} type                    - cancelfullscreen
         * @property {Map} target            - the map fires event
         */
        this._fireEvent('cancelfullscreen');
        return this;
    },

    _requestFullScreen(dom) {
        if (dom.requestFullscreen) {
            dom.requestFullscreen();
        } else if (dom.mozRequestFullScreen) {
            dom.mozRequestFullScreen();
        } else if (dom.webkitRequestFullScreen) {
            dom.webkitRequestFullScreen();
        } else if (dom.msRequestFullScreen) {
            dom.msRequestFullScreen();
        } else {
            const features = 'fullscreen=1,status=no,resizable=yes,top=0,left=0,scrollbars=no,' +
                'titlebar=no,menubar=no,location=no,toolbar=no,z-look=yes,' +
                'width=' + (screen.availWidth - 8) + ',height=' + (screen.availHeight - 45);
            const newWin = window.open(location.href, '_blank', features);
            if (newWin !== null) {
                window.opener = null;
                //close parent window
                window.close();
            }
        }
    },

    _cancelFullScreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        } else {
            const features = 'fullscreen=no,status=yes,resizable=yes,scrollbars=no,' +
                'titlebar=no,menubar=yes,location=yes,toolbar=yes,z-look=yes';
            const newWin = window.open(location.href, '_blank', features);
            if (newWin !== null) {
                window.opener = null;
                //close parent window
                window.close();
            }
        }
    }
});
