const REQUESTOR = function ({ iconReqs, glyphReqs }, cb) {
    let icons, glyphs, iconReady, glyphReady;
    const iconRequestor = new packer.IconRequestor();
    const glyphRequestor = new packer.GlyphRequestor();

    iconRequestor.getIcons(iconReqs, (err, response) => {
        if (err) {
            cb(err);
            return;
        }
        iconReady = true;
        icons = response.icons;
        if (iconReady && glyphReady) {
            cb(null, icons, glyphs);
        }
    });

    glyphRequestor.getGlyphs(glyphReqs, (err, response) => {
        if (err) {
            cb(err);
            return;
        }
        glyphReady = true;
        glyphs = response.glyphs;
        if (iconReady && glyphReady) {
            cb(null, icons, glyphs);
        }
    });
};
