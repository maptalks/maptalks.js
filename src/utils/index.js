export * from './FunctionType';
export * from './FeatureFilter';

import { Ajax } from './Ajax';

export function getJSON(url, cb) {
    Ajax.getJSON(url, cb);
}
