import Zousan from 'zousan';

var promise;

if (typeof Promise !== 'undefined') {
    // built-in Promise
    promise = Promise;
} else {
    promise = Zousan;
}

export default promise;
