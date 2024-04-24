import Car from "./Car";
import Intersection from "./Intersection";
import type Road from "./Road";

type Factory = Intersection | Car | Road;

export default class Pool {
  objects: Record<string, Factory> = {};
  factory: Factory;

  constructor(factory: any, pool: Pool) {
    let k: string, v: any, ref: object;
    this.factory = factory;
    if (!!pool && !!pool.objects) {
      ref = pool.objects;
      for (k in ref) {
        v = ref[k];
        if (!(this.factory instanceof Car)) {
          this.objects[k] = (this.factory as any).copy(v);
        }
      }
    }
  }

  get length() {
    return Object.keys(this.objects).length;
  }

  toJSON() {
    return this.objects;
  }

  get(id: string) {
    return this.objects[id];
  }

  put(obj: Factory) {
    return (this.objects[obj.id] = obj);
  }

  pop(obj: Factory) {
    let ref: string;
    const id = (ref = obj.id) !== null ? ref : obj;
    const result = this.objects[id as string];
    if (result instanceof Car) {
      result.release();
    }
    delete this.objects[id as string];
    return result;
  }

  all() {
    return this.objects;
  }

  clear() {
    return (this.objects = {});
  }
}
