/**
 * gl中基于Programn的赋值操作
 * 需useProgram切换到当前program后才能实际赋值
 */
 class InternalTiny{
    
    constructor(glProgram,name,parameters){
        this._glProgram = glProgram;
        this._name = name;
        this._parameters = parameters;
        glProgram.enQueue()
    }

    apply(){
        const handle = this._glProgram.handle;
        const name = this._name;
        const parameters = this._parameters;
        handle[name].apply(this.parameters);
    }

 }

 module.exports = InternalTiny;