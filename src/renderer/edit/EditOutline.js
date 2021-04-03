export default class EditOutline {

    constructor(target, map) {
        this.target = target;
        target.once('remove', this.delete, this);
        this.map = map;
        this.addTo(map);
    }

    setPoints(points) {
        this.points = points;
        const allX = points.map(p => p.x);
        const allY = points.map(p => p.y);
        this.xmin = Math.min(...allX);
        this.xmax = Math.max(...allX);
        this.ymin = Math.min(...allY);
        this.ymax = Math.max(...allY);
    }

    hitTest() {
        return false;
    }

    render(ctx) {
        const map = this.map;
        if (this.xmax <= 0 || this.xmin >= map.width ||
            this.ymax <= 0 || this.ymin >= map.height) {
            return;
        }
        const dpr = map.getDevicePixelRatio();
        // make line thiner
        const padding = 0.5;
        function c(v) {
            return Math.round(v) * dpr + padding;
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        const points = this.points;
        ctx.moveTo(c(points[0].x), c(points[0].y));
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(c(points[i].x), c(points[i].y));
        }
        ctx.closePath();
        ctx.stroke();
    }

    addTo(map) {
        this.map = map;
        const renderer = map.getRenderer();
        renderer.addTopElement(this);
    }

    delete() {
        if (this.map) {
            const renderer = this.map.getRenderer();
            if (renderer) {
                renderer.removeTopElement(this);
            }
        }
    }
}
