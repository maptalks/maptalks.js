/**
 * 由四角点计算Homography矩阵（投影UV空间 -> 视频UV空间）
 * 返回 3x3 矩阵的 9 个元素数组 (行优先)
 */
export default function computeQuadHomographyElements(corners) {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = corners;
    const dx1 = x1 - x2,
        dy1 = y1 - y2;
    const dx2 = x3 - x2,
        dy2 = y3 - y2;
    const dx3 = x0 - x1 + x2 - x3,
        dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const pg = (dx3 * dy2 - dx2 * dy3) / den;
    const ph = (dx1 * dy3 - dx3 * dy1) / den;

    const m00 = x1 - x0 + pg * x1,
        m01 = x3 - x0 + ph * x3,
        m02 = x0;
    const m10 = y1 - y0 + pg * y1,
        m11 = y3 - y0 + ph * y3,
        m12 = y0;
    const m20 = pg,
        m21 = ph,
        m22 = 1;

    const det =
        m00 * (m11 * m22 - m12 * m21) -
        m01 * (m10 * m22 - m12 * m20) +
        m02 * (m10 * m21 - m11 * m20);

    return [
        (m11 * m22 - m12 * m21) / det,
        -(m01 * m22 - m02 * m21) / det,
        (m01 * m12 - m02 * m11) / det,
        -(m10 * m22 - m12 * m20) / det,
        (m00 * m22 - m02 * m20) / det,
        -(m00 * m12 - m02 * m10) / det,
        (m10 * m21 - m11 * m20) / det,
        -(m00 * m21 - m01 * m20) / det,
        (m00 * m11 - m01 * m10) / det,
    ];
}
