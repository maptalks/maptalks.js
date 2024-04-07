import { on, off, createEl, removeDomNode, addClass, hasClass, setClass } from '../core/util/dom';
import type { Layer } from '../layer';
import Map from '../map/Map';
import Control, { ControlOptionsType } from './Control';

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
const options: LayerSwitcherOptionsType = {
    'position': 'top-right',
    'baseTitle': 'Base Layers',
    'overlayTitle': 'Layers',
    'excludeLayers': [],
    'containerClass': 'maptalks-layer-switcher'
};

/**
 * @classdesc
 * A LayerSwitcher control for the map.
 * @category control
 * @extends control.Control
 * @memberOf control
 * @example
 * var LayerSwitcher = new LayerSwitcher({
 *     position : {'top': '0', 'right': '0'}
 * }).addTo(map);
*/
class LayerSwitcher extends Control {
    container: HTMLDivElement;
    panel: HTMLDivElement;
    button: HTMLButtonElement;
    /**
     * method to build DOM of the control
     * @return {HTMLDOMElement}
     */
    buildOn() {
        const container = this.container = createEl('div', this.options['containerClass']) as HTMLDivElement,
            panel = this.panel = createEl('div', 'panel') as HTMLDivElement,
            button = this.button = createEl('button') as HTMLButtonElement;
        container.appendChild(button);
        container.appendChild(panel);
        return container;
    }

    onAdd() {
        on(this.button, 'mouseover', this._show, this);
        on(this.panel, 'mouseleave', this._hide, this);
        // on(this.getMap(), 'click', this._hide, this);
    }

    onRemove() {
        if (this.panel) {
            off(this.button, 'mouseover', this._show);
            off(this.panel, 'mouseleave', this._hide);
            // off(this.getMap(), 'click', this._hide);
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

    _renderLayers(map: Map, elm: HTMLElement) {
        const base = map.getBaseLayer(),
            layers = map.getLayers(),
            len = layers.length;
        if (base) {
            const baseLayers = (base as any).layers || [base],
                li = createEl('li', 'group'),
                ul = createEl('ul'),
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
                label = createEl('label'),
                input = createEl('input') as HTMLInputElement;
            //checkbox for select/cancel all overlaylayers
            input.type = 'checkbox';
            input.checked = true;
            label.innerHTML = this.options['overlayTitle'];
            li.appendChild(input);
            li.appendChild(label);

            const groupInputOnChange = (e) => {
                const checked = e.target.checked;
                const parentNode = e.target.parentNode;
                if (!parentNode) {
                    return;
                }
                const ul = parentNode.getElementsByTagName('ul')[0];
                if (!ul) {
                    return;
                }
                const parentLayerShow = (node) => {
                    const layer = node._layer;
                    if (layer) {
                        layer[checked ? 'show' : 'hide']();
                    }
                };
                const layerShow = (li) => {
                    const layer = li._layer, checkbox = li.childNodes[0];
                    if (checkbox) {
                        checkbox.checked = checked;
                    }
                    if (layer) {
                        layer[checked ? 'show' : 'hide']();
                    }
                };
                parentLayerShow(parentNode);
                ul.childNodes.forEach(li => {
                    layerShow(li);
                    //检查其是否有子节点,such as :groupgllayer
                    const childUl = li.getElementsByTagName('ul')[0];
                    if (!childUl) {
                        return;
                    }
                    parentLayerShow(li);
                    childUl.childNodes.forEach(li => {
                        layerShow(li);
                    });
                });
            };

            for (let i = 0; i < len; i++) {
                const layer = layers[i];
                if (this._isExcluded(layer)) {
                    //such as :groupgllayer
                    if ((layer as any).getLayers) {
                        const groupLi = createEl('li', 'group'), groupUl = createEl('ul'),
                            groupLabel = createEl('label'), groupInput = createEl('input') as HTMLInputElement;
                        groupLabel.innerHTML = layer.getId();
                        groupInput.type = 'checkbox';
                        groupInput.checked = layer.isVisible();
                        groupInput.onchange = groupInputOnChange;
                        groupLi.appendChild(groupInput);
                        groupLi.appendChild(groupLabel);
                        groupLi.appendChild(groupUl);
                        (groupLi as any)._layer = layer;
                        ul.appendChild(groupLi);
                        const groupLayers = (layer as any).getLayers() || [];
                        groupLayers.forEach(layer => {
                            groupUl.appendChild(this._renderLayer(layer, false, groupInput.checked));
                        });
                    } else {
                        ul.appendChild(this._renderLayer(layer));
                    }
                    //只要有一个子节点不选中，顶级节点就不选中
                    if (layer && !layer.isVisible()) {
                        input.checked = false;
                    }
                }
            }
            li.appendChild(ul);
            elm.appendChild(li);
            input.onchange = groupInputOnChange;
        }
    }

    _isExcluded(layer: Layer) {
        const id = layer.getId(),
            excludeLayers = this.options['excludeLayers'];
        return !(excludeLayers.length && excludeLayers.indexOf(id) >= 0);
    }

    _renderLayer(layer, isBase?: boolean, parentChecked = true) {
        const li = createEl('li', 'layer'),
            label = createEl('label'),
            input = createEl('input'),
            map = this.getMap();
        const visible = layer.options['visible'];
        layer.options['visible'] = true;
        const enabled = layer.isVisible();
        layer.options['visible'] = visible;
        li.className = 'layer';
        const radioInput = input as HTMLInputElement;
        if (isBase) {
            radioInput.type = 'radio';
            radioInput.name = 'base';
        } else {
            radioInput.type = 'checkbox';
        }

        radioInput.checked = visible && enabled;
        //父节点没有选中，那么子节点一定不选中
        if (!parentChecked) {
            radioInput.checked = false;
        }
        if (!enabled) {
            radioInput.setAttribute('disabled', 'disabled');
        }

        radioInput.onchange = e => {
            if ((e.target as any).type === 'radio') {
                const baseLayer = map.getBaseLayer(),
                    baseLayers = (baseLayer as any).layers;
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
                layer[(e.target as any).checked ? 'show' : 'hide']();
            }
            this.fire('layerchange', { target: layer });
        };
        li.appendChild(input);
        label.innerHTML = layer.getId();
        li.appendChild(label);
        (li as any)._layer = layer;
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

export type LayerSwitcherOptionsType = {
    baseTitle?: string;
    overlayTitle?: string;
    containerClass?: string;
    excludeLayers?: Array<string>;
} & ControlOptionsType;
