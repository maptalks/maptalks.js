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

var clipPolygon = function (subjectPolygon, clipPolygon) {
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

export default clipPolygon;