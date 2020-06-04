export default class DrawBuffersExt {
    constructor(context) {
        this.context = context;
        this['COLOR_ATTACHMENT0_WEBGL'] = 0x8CE0;
        this['COLOR_ATTACHMENT1_WEBGL'] = 0x8CE1;
        this['COLOR_ATTACHMENT2_WEBGL'] = 0x8CE2;
        this['COLOR_ATTACHMENT3_WEBGL'] = 0x8CE3;
        this['COLOR_ATTACHMENT4_WEBGL'] = 0x8CE4;
        this['COLOR_ATTACHMENT5_WEBGL'] = 0x8CE5;
        this['COLOR_ATTACHMENT6_WEBGL'] = 0x8CE6;
        this['COLOR_ATTACHMENT7_WEBGL'] = 0x8CE7;
        this['COLOR_ATTACHMENT8_WEBGL'] = 0x8CE8;
        this['COLOR_ATTACHMENT9_WEBGL'] = 0x8CE9;
        this['COLOR_ATTACHMENT10_WEBGL'] = 0x8CE10;
        this['COLOR_ATTACHMENT11_WEBGL'] = 0x8CE11;
        this['COLOR_ATTACHMENT12_WEBGL'] = 0x8CE12;
        this['COLOR_ATTACHMENT13_WEBGL'] = 0x8CE13;
        this['COLOR_ATTACHMENT14_WEBGL'] = 0x8CE14;
        this['COLOR_ATTACHMENT15_WEBGL'] = 0x8CE15;

        this['DRAW_BUFFER0_WEBGL'] = 0x8825;
        this['DRAW_BUFFER1_WEBGL'] = 0x8826;
        this['DRAW_BUFFER2_WEBGL'] = 0x8827;
        this['DRAW_BUFFER3_WEBGL'] = 0x8828;
        this['DRAW_BUFFER4_WEBGL'] = 0x8829;
        this['DRAW_BUFFER5_WEBGL'] = 0x882A;
        this['DRAW_BUFFER6_WEBGL'] = 0x882B;
        this['DRAW_BUFFER7_WEBGL'] = 0x882C;
        this['DRAW_BUFFER8_WEBGL'] = 0x882D;
        this['DRAW_BUFFER9_WEBGL'] = 0x882E;
        this['DRAW_BUFFER10_WEBGL'] = 0x882F;
        this['DRAW_BUFFER11_WEBGL'] = 0x8830;
        this['DRAW_BUFFER12_WEBGL'] = 0x8831;
        this['DRAW_BUFFER13_WEBGL'] = 0x8832;
        this['DRAW_BUFFER14_WEBGL'] = 0x8833;
        this['DRAW_BUFFER15_WEBGL'] = 0x8834;
        this['MAX_COLOR_ATTACHMENTS_WEBGL'] = 0x8CDF;
        this['MAX_DRAW_BUFFERS_WEBGL'] = 0x882;
    }

    drawBuffersWEBGL() {
        return this.context.drawBuffers.apply(this.context, arguments);
    }
}
