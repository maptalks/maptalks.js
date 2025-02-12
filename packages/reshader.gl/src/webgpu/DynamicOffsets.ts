export default class DynamicOffsets {

    items: any[];
    offsets: number[];
    index: number;

    constructor() {
        this.items = [];
        this.offsets = [];
        this.index = 0;
    }

    reset() {
        this.index = 0;
        this.items.length = 0;
        this.offsets.length = 0;
    }

    addItem(item) {
        this.items[this.index++] = item;
    }

    addItems(items: any[]) {
        for (let i = 0; i < items.length; i++) {
            this.addItem(items[i]);
        }
    }

    getDynamicOffsets() {
        const items = this.items;
        items.sort((a, b) => a.binding - b.binding);
        for (let i = 0; i < items.length; i++) {
            this.offsets[i] = items[i].offset;
        }
        return this.offsets;
    }
}
