import Map from './Map';

declare module "./Map" {
    interface Map {
        isFullScreen(): boolean;
        requestFullScreen(dom?: HTMLDivElement): this;
        cancelFullScreen(): this;
        _requestFullScreen(dom: HTMLDivElement): void;
        _cancelFullScreen(): void;

    }
}


Map.include(/** @lends Map.prototype */ {
    /**
     * @return {Boolean} Element is currently in fullscreen.
     */
    isFullScreen() {
        const doc = document as any;
        return !!(
            doc.webkitIsFullScreen || doc.mozFullScreen ||
            doc.msFullscreenElement || doc.fullscreenElement
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
        const doc=document as any;
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (doc.mozCancelFullScreen) {
            doc.mozCancelFullScreen();
        } else if (doc.webkitCancelFullScreen) {
            doc.webkitCancelFullScreen();
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
