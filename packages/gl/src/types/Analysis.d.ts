// implementation in analysis submodule
interface Analysis {
    addTo(layer: any): this
    enable()
    disable()
    isEnabled(): boolean
    remove()
    update(name: string, value: string | number | number[])
    getExcludedLayers(): string[]
    setExcludedLayers(layerIds: string[])
    exportAnalysisMap(meshes: any[]): Uint8Array
    getAnalysisType(): string
}
