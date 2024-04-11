/* eslint-disable no-unused-vars */
const REQUESTOR = function (iconReqs, glyphReqs, cb) {
    const iconRequestor = new packer.IconRequestor();
    const glyphRequestor = new packer.GlyphRequestor();

    const glyphs = glyphRequestor.getGlyphs(glyphReqs);

    iconRequestor.getIcons(iconReqs, (err, response) => {
        if (err) {
            cb(err);
            return;
        }

        const icons = response.icons;
        cb(null, { icons, glyphs: glyphs.glyphs });
    });


};
/* eslint-enable no-unused-vars */
