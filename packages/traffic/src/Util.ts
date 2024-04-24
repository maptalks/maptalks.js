let idCounter = 0;

export function sample(obj: any, num?: number, guard?: number) {
  if (num == null || guard) {
    if (obj.length !== +obj.length) obj = Object.values(obj);
    return obj[rand(obj.length - 1)];
  }
  return shuffle(obj).slice(0, Math.max(0, num));
}

export function shuffle(obj: object) {
  let randNum: number;
  let index = 0;
  const shuffled = [];
  for (const key of Object.keys(obj)) {
    randNum = rand(index++);
    shuffled[index - 1] = shuffled[randNum];
    shuffled[randNum] = obj[key];
  }
  return shuffled;
}

export function uniqueId(prefix: string) {
  const id = ++idCounter + "";
  return prefix ? prefix + id : id;
}

export function rand(min: number, max?: number) {
  if (!max) {
    max = min;
    min = 0;
  }
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function isObject(obj: object) {
  return obj === Object(obj);
}
