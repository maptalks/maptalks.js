import Event from './../utils/Event';

class Container extends Event{

    constructor(){
        super();
    }

    run(){
        this.fire("event.fire",{},true);
    }
}

export default Container;