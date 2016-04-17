Z.Map.mergeOptions({
    'draggable': true
});

Z.Map.Drag = Z.Handler.extend({
    addHooks: function () {
        var map = this.target;
        if (!map) {return;}
        this.dom = map._containerDOM;
        this._dragHandler = new Z.Handler.Drag(this.dom);
        map.on(this._dragHandler.START.join(' '), this._onMouseDown,this);

        this._dragHandler.on("dragstart", this._onDragStart, this);
        this._dragHandler.on("dragging", this._onDragging, this);
        this._dragHandler.on("dragend", this._onDragEnd, this);

        this._dragHandler.enable();
    },

    removeHooks: function () {
        var map = this.target;
        map.off(this._dragHandler.START.join(' '), this._onMouseDown,this);
        this._dragHandler.disable();
        delete this._dragHandler;
    },


    _onMouseDown:function(param) {
        if (this.target._panAnimating) {
            this.target._enablePanAnimation=false;
        }
    },

    _onDragStart:function(param) {
        var map = this.target;
        this.startDragTime = new Date().getTime();
        var domOffset = map.offsetPlatform();
        this.startLeft = domOffset.x;
        this.startTop = domOffset.y;
        this.preX = param['mousePos'].x;
        this.preY = param['mousePos'].y;
        this.startX = this.preX;
        this.startY = this.preY;
        map._onMoveStart();
    },

    _onDragging:function(param) {
        var map = this.target;
        var mx = param['mousePos'].x,
            my = param['mousePos'].y;
        var nextLeft = (this.startLeft + mx - this.startX);
        var nextTop = (this.startTop + my - this.startY);
        var currentDomOffset = map.offsetPlatform();
        map.offsetPlatform(new Z.Point(nextLeft,nextTop)._substract(currentDomOffset));
        map._offsetCenterByPixel(new Z.Point(-nextLeft,-nextTop)._add(currentDomOffset));
        map._onMoving();
    },

    _onDragEnd:function(param) {
        var map = this.target;
        var t = new Date().getTime()-this.startDragTime;
        var domOffset = map.offsetPlatform();
        var xSpan =  domOffset.x - this.startLeft;
        var ySpan =  domOffset.y - this.startTop;
        if (t<280 && Math.abs(ySpan)+Math.abs(xSpan) > 5) {
            map._enablePanAnimation=true;
            var distance = new Z.Point(xSpan*Math.ceil(500/t),ySpan*Math.ceil(500/t)).multi(0.5);
            t = 5*t*(Math.abs(distance.x)+Math.abs(distance.y))/600;
            map._panAnimation(distance._multi(2/3),t);
        } else {
            map._onMoveEnd();
        }

    }
});

Z.Map.addInitHook('addHandler', 'draggable', Z.Map.Drag);
