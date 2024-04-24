export default class ControlSignals {
    constructor(intersection) {
        this.intersection = intersection;
        this.time = 0;
        this.flipMultiplier = 1 + (Math.random() * 0.4 - 0.2);
        this.stateNum = 0;
        this.lightsFlipInterval = 20;
        this.states = [['L', '', 'L', ''], ['FR', '', 'FR', ''], ['', 'L', '', 'L'], ['', 'FR', '', 'FR']];
    }

    get flipInterval() {
        return this.flipMultiplier * this.lightsFlipInterval;
    }

    get state() {
        let stringState = this.states[this.stateNum % this.states.length];
        if (this.intersection.roads.length <= 2) {
            stringState = ['LFR', 'LFR', 'LFR', 'LFR'];
        }
        const results = [];
        for (let i = 0, len = stringState.length; i < len; i++) {
            const x = stringState[i];
            results.push(this.decode(x));
        }
        return results;
    }

    decode(str) {
        const state = [0, 0, 0];
        const indexOf = [].indexOf || function(item) { for (let i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
        if (indexOf.call(str, 'L') >= 0) state[0] = 1;
        if (indexOf.call(str, 'F') >= 0) state[1] = 1;
        if (indexOf.call(str, 'R') >= 0) state[2] = 1;
        return state;
    }

    flip() {
        return this.stateNum += 1;
    }

    onTick(delta) {
        this.time += delta;
        if (this.time > this.flipInterval) {
            this.flip();
            return this.time -= this.flipInterval;
        }
        return null;
    }
}
