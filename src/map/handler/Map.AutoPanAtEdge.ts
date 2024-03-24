import Handler from '../../handler/Handler';
import Map from '../Map';

// Edge Detection Distance(Units are pixels).
const PANOFFSET = 30;

class MapAutoPanAtEdgeHandler extends Handler {
    addHooks() {
        if (!this.target) {
            return;
        }
        this.target.on('_mousemove', this._onMouseMove, this);
    }

    removeHooks() {
        if (!this.target) {
            return;
        }
        this.target.off('_mousemove', this._onMouseMove, this);
    }

    _onMouseMove(event) {
        const map = this.target;
        if (map.options['autoPanAtEdge']) {
            const { containerPoint } = event;
            const containerExtent = map.getContainerExtent();
            if (containerExtent) {
                const { x, y } = containerPoint;
                const { xmax, ymax } = containerExtent;
                let p;
                if (x < PANOFFSET) {
                    p = [Math.abs(x - PANOFFSET), 0];
                }
                if (y < PANOFFSET) {
                    p = [0, Math.abs(y - PANOFFSET)];
                }
                if ((x + PANOFFSET) > xmax) {
                    p = [-Math.abs((x + PANOFFSET) - xmax), 0];
                }
                if ((y + PANOFFSET) > ymax) {
                    p = [0, -Math.abs((y + PANOFFSET) - ymax)];
                }
                if (p) {
                    map.panBy(p, { duration: 1 });
                }
            }
        }
    }
}

Map.mergeOptions({
    'autoPanAtEdge': false
});

Map.addOnLoadHook('addHandler', 'autoPanAtEdge', MapAutoPanAtEdgeHandler);

export default MapAutoPanAtEdgeHandler;
