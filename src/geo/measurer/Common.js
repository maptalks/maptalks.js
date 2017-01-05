export default {
    measureLength: function (c1, c2) {
        if (!Array.isArray(c1)) {
            return this.measureLenBetween(c1, c2);
        }
        var len = 0;
        for (let i = 0, l = c1.length; i < l - 1; i++) {
            len += this.measureLenBetween(c1[i], c1[i + 1]);
        }
        return len;
    }
};
