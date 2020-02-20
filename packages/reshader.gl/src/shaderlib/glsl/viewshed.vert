    #ifdef HAS_VIEWSHED
        uniform mat4 viewshed_projViewMatrixFromViewpoint;
        varying vec4 viewshed_positionFromViewpoint;
        void viewshed_getPositionFromViewpoint(vec4 scenePosition) {
            viewshed_positionFromViewpoint = viewshed_projViewMatrixFromViewpoint * scenePosition;
        }
    #endif