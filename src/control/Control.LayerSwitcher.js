import { on, off, createEl, removeDomNode, addClass, hasClass, setClass } from '../core/util/dom';
import Map from '../map/Map';
import Control from './Control';

/**
 * @property {Object} options - options
 * @property {Object} [options.position='top-right'] - position of the control
 * @property {Object} [options.baseTitle='Base Layers'] - title of the base layers
 * @property {Object} [options.overlayTitle='Layers'] - title of the overlay layers
 * @property {Object} [options.excludeLayers=[]] - ids of layers that don't display in layerswitcher
 * @property {Object} [options.containerClass=maptalks-layer-switcher] - layerswitcher's container div's CSS class
 *
 * @memberOf control.LayerSwitcher
 * @instance
 */
const options = {
    'position' : 'top-right',
    'baseTitle' : 'Base Layers',
    'overlayTitle' : 'Layers',
    'excludeLayers' : [],
    'containerClass' : 'maptalks-layer-switcher'
};

/**
 * @classdesc
 * A layerswither control for the map.
 * @category control
 * @extends control.Control
 * @memberOf control
 * @example
 * var layerswither = new Layerswither({
 *     position : {'top': '0', 'right': '0'}
 * }).addTo(map);
*/
class LayerSwitcher extends Control {
    /**
     * method to build DOM of the control
     * @return {HTMLDOMElement}
     */
    buildOn() {
        const container = this.container = createEl('div', this.options['containerClass']),
            panel = this.panel = createEl('div', 'panel'),
            button = this.button = createEl('button');
        container.appendChild(button);
        container.appendChild(panel);
        return container;
    }

    onAdd() {
        on(this.button, 'mouseover', this._show, this);
        on(this.panel, 'mouseleave', this._hide, this);
        on(this.getMap(), 'click', this._hide, this);
    }

    onRemove() {
        if (this.panel) {
            off(this.button, 'mouseover', this._show, this);
            off(this.panel, 'mouseleave', this._hide, this);
            off(this.getMap(), 'click', this._hide, this);
            removeDomNode(this.panel);
            removeDomNode(this.button);
            delete this.panel;
            delete this.button;
            delete this.container;
        }
    }

    _show() {
        if (!hasClass(this.container, 'shown')) {
            addClass(this.container, 'shown');
            this._createPanel();
        }
    }

    _hide(e) {
        if (!this.panel.contains(e.toElement || e.relatedTarget)) {
            setClass(this.container, this.options['containerClass']);
        }
    }

    _createPanel() {
        this.panel.innerHTML = '';
        const ul = createEl('ul');
        this.panel.appendChild(ul);
        this._renderLayers(this.getMap(), ul);
    }

    _renderLayers(map, elm) {
        const base = map.getBaseLayer(),
            layers = map.getLayers(),
            len = layers.length;
        if (base) {
            const baseLayers = base.layers || [base],
                li = createEl('li', 'group'),
                ul =  createEl('ul'),
                label = createEl('label');
            label.innerHTML = this.options['baseTitle'];
            li.appendChild(label);
            for (let i = 0, len = baseLayers.length; i < len; i++) {
                const layer = baseLayers[i];
                if (this._isExcluded(layer)) {
                    ul.appendChild(this._renderLayer(baseLayers[i], true));
                    li.appendChild(ul);
                    elm.appendChild(li);
                }
            }
        }

        if (len) {
            const li = createEl('li', 'group'),
                ul = createEl('ul'),
                label = createEl('label');
            label.innerHTML = this.options['overlayTitle'];
            li.appendChild(label);
            for (let i = 0; i < len; i++) {
                const layer = layers[i];
                if (this._isExcluded(layer)) {
                    ul.appendChild(this._renderLayer(layer));
                }
            }
            li.appendChild(ul);
            elm.appendChild(li);
        }
    }

    _isExcluded(layer) {
        const id = layer.getId(),
            excludeLayers = this.options['excludeLayers'];
        return !(excludeLayers.length && excludeLayers.indexOf(id) >= 0);
    }

    _renderLayer(layer, isBase) {
        const li = createEl('li', 'layer'),
            label =  createEl('label'),
            input = createEl('input'),
            map = this.getMap();
        const visible = layer.options['visible'];
        layer.options['visible'] = true;
        const enabled = layer.isVisible();
        layer.options['visible'] = visible;
        li.className = 'layer';
        if (isBase) {
            input.type = 'radio';
            input.name = 'base';
        } else {
            input.type = 'checkbox';
        }

        input.checked = visible && enabled;
        if (!enabled) {
            input.setAttribute('disabled', 'disabled');
        }

        input.onchange = e => {
            if (e.target.type === 'radio') {
                const baseLayer = map.getBaseLayer(),
                    baseLayers = baseLayer.layers;
                if (baseLayers) {
                    for (let i = 0, len = baseLayers.length; i < len; i++) {
                        const _baseLayer = baseLayers[i];
                        _baseLayer[_baseLayer === layer ? 'show' : 'hide']();
                    }
                } else if (!baseLayer.isVisible()) {
                    baseLayer.show();
                }
                map._fireEvent('setbaselayer');
            } else {
                layer[e.target.checked ? 'show' : 'hide']();
            }
            this.fire('layerchange', { target : layer });
        };
        li.appendChild(input);
        label.innerHTML = layer.getId();
        li.appendChild(label);
        return li;
    }
}

LayerSwitcher.mergeOptions(options);

Map.mergeOptions({
    'layerSwitcherControl': false
});

Map.addOnLoadHook(function () {
    if (this.options['layerSwitcherControl']) {
        this.layerSwitcherControl = new LayerSwitcher(this.options['layerSwitcherControl']);
        this.addControl(this.layerSwitcherControl);
    }
});

export default LayerSwitcher;
