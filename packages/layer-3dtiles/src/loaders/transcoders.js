import transcoders from '@maptalks/gl/dist/transcoders.js';
let currentTranscoders = null
export default function () {
    if (!currentTranscoders) {
        currentTranscoders = {
            'image/crn': transcoders.crn && transcoders.crn(),
            'image/ktx2': transcoders.ktx2 && transcoders.ktx2(),
            'image/cttf': transcoders.ktx2 && transcoders.ktx2(),
            'draco': transcoders.draco && transcoders.draco()
        };
    }
    return currentTranscoders;
}
