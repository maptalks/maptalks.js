
/**
*   author:acmeism
*   RosettaCodeData-github
*   @method clipPolygon
*   @params [Array] subjectPolygon 输入多边形 
*       形如:"[[50, 150], [200, 50], [350, 150], [350, 300], [250, 300], [200, 250], [150, 350], [100, 250], [100, 200]]"
*   @params [Array} clipPolygon 裁剪区域矩形，Mask 
*       形如:"[[100, 100], [300, 100], [300, 300], [100, 300]]"
*
*/
let clipPolygon = function (subjectPolygon, clipPolygon) {
    var cp1, cp2, s, e;
    var inside = function (p) {
        return (cp2[0] - cp1[0]) * (p[1] - cp1[1]) > (cp2[1] - cp1[1]) * (p[0] - cp1[0]);
    };
    var intersection = function () {
        var dc = [cp1[0] - cp2[0], cp1[1] - cp2[1]],
            dp = [s[0] - e[0], s[1] - e[1]],
            n1 = cp1[0] * cp2[1] - cp1[1] * cp2[0],
            n2 = s[0] * e[1] - s[1] * e[0],
            n3 = 1.0 / (dc[0] * dp[1] - dc[1] * dp[0]);
        return [(n1 * dp[0] - n2 * dc[0]) * n3, (n1 * dp[1] - n2 * dc[1]) * n3];
    };
    var outputList = subjectPolygon;
    cp1 = clipPolygon[clipPolygon.length - 1];
    //
    var i, j, leni,
        lenj = clipPolygon.length;
    for (j = 0; j < lenj; j++) {
        var cp2 = clipPolygon[j],
            inputList = outputList;
        outputList = [];
        leni = inputList.length;
        s = inputList[leni - 1];
        for (i = 0; i < leni; i++) {
            var e = inputList[i];
            if (inside(e)) {
                if (!inside(s)) {
                    outputList.push(intersection());
                }
                outputList.push(e);
            }
            else if (inside(s)) {
                outputList.push(intersection());
            }
            s = e;
        }
        cp1 = cp2;
    }
    return outputList;
}

/**
*  Cohen-Sutherland裁剪算法
*  编码方式如下：
*  1001 | 1000 | 1010
* -----------------------
*  0001 | 0000 | 0010
* -----------------------
*  0101 | 0100 | 0110
*  编码方式
*  @method clipPolyline
*  @param {Array} subLineString  被切割折线
*  @param {Hmap.BaseType.Bound} bound bound.toArray() 裁剪区域边界
*/
let clipPolyline = function (subLineString, bound) {
    var TOP = 8, LEFT = 1, RIGTH = 2, BOTTOM = 4; //方位编码
    //根据x,y做编码方位判断
    var encode = function (x, y) {
        var c = 0;
        if (x < xl)
            c |= LEFT;
        if (x > xr)
            c |= RIGTH;
        if (y < yb)
            c |= BOTTOM;
        if (y > yt)
            c |= TOP;
        return c;
    }
    //
    var clipLine = function (start, end) {
        var code, x, y, //交点坐标
            x1 = start[0], x2 = end[0], y1 = start[1], y2 = end[1],
            code1 = encode(x1, y1),
            code2 = encode(x2, y2);
        //线不全在窗口内,分多次判断
        while (code1 != 0 || code2 != 0) {
            //1.先在窗口外,返回一个空数组
            if ((code1 & code2) != 0)
                return [];
            code = code1;
            //找窗口外的点
            if (code1 == 0) code = code2;
            //点在左边
            if ((LEFT & code) != 0) {
                x = xl;
                y = y1 + (y2 - y1) * (xl - x1) / (x2 - x1);
            }
            //点在右边
            else if ((RIGTH & code) != 0) {
                x = xr;
                y = y1 + (y2 - y1) * (xr - x1) / (x2 - x1);
            }
            //点在下面
            else if ((BOTTOM & code) != 0) {
                y = yb;
                x = x1 + (x2 - x1) * (yb - y1) / (y2 - y1);
            }
            else if ((TOP & code) != 0) {
                y = yt;
                x = x1 + (x2 - x1) * (yt - y1) / (y2 - y1);
            }
            //
            if (code == code1) {
                x1 = x;
                y1 = y;
                code1 = encode(x, y);
            }
            else {
                x2 = x;
                y2 = y;
                code2 = encode(x, y);
            }
        }
        return [[x1, y1], [x2, y2]];
    }
    //正式裁剪
    var clipLines = [], i, temp,
        xl = bound[1],//左上角x坐标 left
        xr = bound[3],//右下角x坐标 right
        yt = bound[0],//右上角y坐标 top
        yb = bound[2],//右下角y坐标 bottom
        len = subLineString.length;
    for (i = 0; i < len; i++) {
        var len2 = subLineString[i].length;
        for (var j = 0; j < len2 - 1; j++) {
            start = subLineString[i][j];
            end = subLineString[i][j + 1];
            var cliped = clipLine(start, end);
            clipLines = clipLines.concat(cliped);
        }
    }
    return clipLines;
}

export default {clipPolygon,clipPolyline};