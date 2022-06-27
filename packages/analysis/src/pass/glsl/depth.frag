#ifdef GL_ES
precision highp float;
#endif
/**
* 分解保存深度值
*/
vec4 pack (float depth) {
    // 当光源与照射物间距离变远,z值会增大,而1个分量的8位已经不够存储深度值,所以扩充使用4个分量共32位进行存储
    // 使用rgba 4字节共32位来存储z值,1个字节精度为1/256
    const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);
    const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);
    // gl_FragCoord:片元的坐标,fract():返回数值的小数部分
    vec4 rgbaDepth = fract(depth * bitShift); //计算每个点的z值
    rgbaDepth -= rgbaDepth.gbaa * bitMask; // Cut off the value which do not fit in 8 bits
    return rgbaDepth;
}
//该片元着色器目的是计算每个片元的深度值z,并把z值保存到gl_FragColor中,可以把该纹理看成是深度值z的容器,因为它并不会渲染出来
void main() {
    gl_FragColor = pack(gl_FragCoord.z);// 将z值分开存储到rgba分量中,阴影颜色的同时也是深度值z
}
