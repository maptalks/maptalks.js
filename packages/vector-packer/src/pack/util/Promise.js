import Zousan from 'zousan';

let promise;

if (typeof Promise !== 'undefined') {
    // built-in Promise
    promise = Promise;
} else {
    promise = Zousan;
}

export default promise;
