import Event from './../utils/Event';

class Container extends Event{
    run(){
        this.fire("event.fire");
    }
}

export default Container;