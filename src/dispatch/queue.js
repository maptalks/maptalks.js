/**
 * 
 */
const isString = require('./../utils/isString'),
    stamp = require('./../utils/stamp').stamp;


const Tinys={

}

const enQueue = (glProgram,tiny) =>{
    const id = glProgram.id;
    if(Tinys[id]){
        Tinys[id] = [];
    }
    const queue = Tinys[id];
    queue.push(tiny);
}

const acquireQueue = (id)=>{
    const glProgramId = isString(id)?id:stamp(id);
    return Tinys[glProgramId];
}

module.exports = {
    enQueue,
    acquireQueue
}
