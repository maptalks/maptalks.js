//we only use perspective camera
//a very simple perspective camera class
class PerspectiveCamera {
    constructor(projectMatrix, viewMatrix) {
        this._projectMatrix = projectMatrix;
        this._viewMatrix = viewMatrix;
    }

    get viewMatrix() {
        return this._viewMatrix;
    }

    get projectMatrix() {
        return this._projectMatrix;
    }
}

export default PerspectiveCamera;
