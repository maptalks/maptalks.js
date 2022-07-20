#if defined(HAS_HIGHLIGHT_COLOR)
    attribute vec4 aHighlightColor;
    varying vec4 vHighlightColor;
#endif

#if defined(HAS_HIGHLIGHT_OPACITY)
    attribute float aHighlightOpacity;
    varying float vHighlightOpacity;
#endif

void highlight_setVarying() {
    #if defined(HAS_HIGHLIGHT_COLOR)
        vHighlightColor = aHighlightColor / 255.0;
    #endif

    #if defined(HAS_HIGHLIGHT_OPACITY)
        vHighlightOpacity = aHighlightOpacity / 255.0;
    #endif
}
