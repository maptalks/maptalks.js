/**
 * set _kiwi_id_ for object
 */
const i = 1,
    prefix='_kiwi_id_';

let getId = () => {
    return prefix + (i++);
};

let stamp = (obj) => {
    obj._kiwi_id_ = obj._kiwi_id_ || getId();
    return obj._kiwi_id_
};

export default stamp;

export {prefix,getId}