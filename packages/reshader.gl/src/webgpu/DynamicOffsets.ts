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
    }

    addItem(binding, offset) {
        const index = this.index++;
        const obj = this.items[index];
        if (!obj) {
            this.items[index] = { binding, offset };
        } else {
            obj.binding = binding;
            obj.offset = offset;
        }
    }

    addItems(items: any[]) {
        for (let i = 0; i < items.length; i++) {
            this.addItem(items[i].binding, items[i].offset);
        }
    }

    getItems() {
        return this.items.slice(0, this.index);
    }

    getDynamicOffsets() {
        const items = this.getItems();
        items.sort((a, b) => a.binding - b.binding);
        this.offsets.length = items.length;
        for (let i = 0; i < items.length; i++) {
            this.offsets[i] = items[i].offset;
        }
        return this.offsets;
    }
}
