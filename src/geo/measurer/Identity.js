Z.measurer.Identity = {
    'measure' : 'IDENTITY',
    measureLength:function(c1,c2){
        if (!c1 || !c2) {return 0;}
        try {
            return Math.sqrt(Math.pow(c1.x-c2.x,2)+Math.pow(c1.y-c2.y,2));
        } catch (err) {
            return 0;
        }
    },
    measureArea:function(coordinates) {
        if (!Z.Util.isArrayHasData(coordinates)) {
            return 0;
        }
        var area = 0;
        for ( var i = 0, len = coordinates.length; i < len; i++) {
            var c1 = coordinates[i];
            var c2 = null;
            if (i === len - 1) {
                c2 = coordinates[0];
            } else {
                c2 = coordinates[i+1];
            }
            area += c1.x * c2.y - c1.y * c2.x;
        }
        return Math.abs(area / 2);
    },
    locate:function(c, xDist, yDist) {
        if (!c) {return null;}
        if (!xDist) {xDist = 0;}
        if (!yDist) {yDist = 0;}
        if (!xDist && !yDist) {return c;}
        return new Z.Coordinate(c.x+xDist, c.y+yDist);
    }
}
