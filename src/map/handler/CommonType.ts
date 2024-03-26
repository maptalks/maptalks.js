// TODO:等待Coordinate，Geometry，Point补充类型
export type Event = {
    type: string
    target: any
    coordinate: any
    containerPoint: any
    viewPoint: any
    domEvent: Event
}


// TODO:等待Coordinate，Geometry，Point补充类型
export type Param = {
    type: string
    target: any
    geometry: any
    coordinate: any
    containerPoint: any
    viewPoint: any
    domEvent: MouseEvent
    ignoreEndEvent?: boolean
    interupted?: boolean
}