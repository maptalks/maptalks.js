const REQUESTOR = function ({ iconReqs, glyphReqs }, cb) {
    let icons, glyphs;
    const iconRequestor = new packer.IconRequestor();
    const glyphRequestor = new packer.GlyphRequestor();

    iconRequestor.getIcons(iconReqs, (err, response) => {
        if (err) {
            cb(err);
            return;
        }
        icons = response.icons;
        if (icons && glyphs) {
            cb(null, icons, glyphs);
        }
    });

    glyphRequestor.getGlyphs(glyphReqs, (err, response) => {
        if (err) {
            cb(err);
            return;
        }
        glyphs = response.glyphs;
        if (icons && glyphs) {
            cb(null, icons, glyphs);
        }
    });
};
