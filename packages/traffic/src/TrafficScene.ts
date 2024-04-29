import * as maptalks from "maptalks";
import * as turf from "turf";

import { GLTFLayer, MultiGLTFMarker } from "@maptalks/gltf-layer";

import Car from "./Car";
import Intersection from "./Intersection";
import type Lane from "./Lane";
import Pool from "./Pool";
import Rect from "./Rect";
import Road from "./Road";
import { sample } from "./Util";

interface TrafficSceneOptions {
  carsNumber?: number;
  gridSize?: number;
}

export default class TrafficScene {
  toRemove = [];
  options: TrafficSceneOptions;
  carsNumber: number;
  gridSize: number;
  carsList = {};
  cars: Pool;
  intersections: Pool;
  roads: Pool;

  _lastUpdate = 0;

  private _previousTime = 0;
  private _carlayer = new GLTFLayer("traffic");
  private _timeFactor = 5;
  private _state = "stop";
  private _symbols = [];
  private _instanceMap = {};
  private _rafId: number;
  private _groupgllayer: any;

  constructor(options: TrafficSceneOptions) {
    this.options = options || {};
    this.carsNumber = this.options.carsNumber || 10;
    this.gridSize = this.options.gridSize || 32;
    this.set();
  }

  /**
   * 开始运行交通轨迹。
   *
   * @english
   * Start running traffic trajectory.
   * @return void
   */
  run() {
    this._state = "running";
    this._update();
  }

  /**
   * 停止运行交通轨迹。
   *
   * @english
   * Stop running traffic trajectory.
   * @return void
   */
  stop() {
    this._state = "stop";
  }

  /**
   * 移除当前轨迹图层。
   *
   * @english
   * Remove the traffic trajectory layer.
   * @return void
   */
  remove() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }
    this._carlayer.remove();
    delete (this as any).map;
  }

  /**
   * 设置模型的样式。
   *
   * @english
   * Set symbols of gltf models.
   * @param symbols - symbols of gltf markers
   * @return void
   */
  setSymbols(symbols: object[]) {
    this._symbols = symbols;
    for (let i = 0; i < this._symbols.length; i++) {
      const symbol = this._symbols[i];
      this._instanceMap[symbol.url] = new MultiGLTFMarker([], { symbol }).addTo(
        this._carlayer
      );
    }
  }

  _update() {
    if (this._state !== "running") {
      return;
    }
    const now = Date.now();
    this._lastUpdate = now;
    const time = Date.now();
    let delta = time - this._previousTime || 0;
    if (delta > 100) {
      delta = 100;
    }
    this._previousTime = time;
    this.onTick((this._timeFactor * delta) / 1000);
    let id;
    // remove car
    let i = this.toRemove.length;
    while (i--) {
      this._removeCar(this.toRemove[i]);
    }
    this.clearTmpRemove();
    const carsMap = this.cars.all();
    for (id in carsMap) {
      this._addCar(carsMap[id] as Car);
    }
    this._rafId = window.requestAnimationFrame(this._update.bind(this));
  }

  _updateInstanceData() {
    for (const t in this._instanceMap) {
      this._instanceMap[t].removeData();
    }
    for (const id in this.carsList) {
      const car = this.carsList[id];
      const url = car.url;
      this._instanceMap[url].addData(car);
    }
  }

  _addCar(car: Car) {
    const id = car.id.substring(3);
    if (!this.carsList[id]) {
      const symbol =
        this._symbols[Math.floor(Math.random() * this._symbols.length)];
      this.carsList[id] = {
        coordinates: null,
        direction: null,
        url: symbol.url,
      };
      this.showHideCar(this.carsList[id], "show");
    } else {
      if (!car) {
        return;
      }
      const p = car.coords;
      const r = car.direction;
      const map = this.map;
      const coord = map.pointAtResToCoordinate(
        new maptalks.Point(p.x / this.gridSize, p.y / this.gridSize),
        map.getGLRes()
      );
      const direction = (r / Math.PI) * 180 + 90;
      this.carsList[id].coordinates = coord;
      this.carsList[id].rotation = [0, 0, direction];
      const index = this._getInstanceIndex(id);
      const url = this.carsList[id].url;
      if (index > -1) {
        this._instanceMap[url].updateData(index, this.carsList[id]);
      } else {
        this._instanceMap[url].addData(this.carsList[id]);
      }
    }
  }

  /**
   * 显示隐藏车辆模型。
   *
   * @english
   * Show or hide car model.
   * @param car - car model
   * @param type - action type show or hide
   * @param id - car model id
   * @return void
   */
  showHideCar(car: Car, type?: string, id?: string) {
    const targetStyles = {
      symbol: {
        transparent: 1,
      },
    };
    const that = this;
    const player = maptalks.animation.Animation.animate(
      targetStyles,
      {
        duration: 1000,
        easing: "out",
      },
      function step(frame) {
        if (frame.state.playState === "running") {
          let opacity = 0;
          if (type === "show") {
            opacity = frame.styles.symbol.transparent;
            // car.setUniform('polygonOpacity', opacity);
            car.color = [1, 1, 1, opacity];
          } else if (type === "hide") {
            opacity = 1 - frame.styles.symbol.transparent;
            // car.setUniform('polygonOpacity', opacity);
            car.color = [1, 1, 1, opacity];
            if (opacity < 0.01) {
              setTimeout(function () {
                // car.remove();
                const index = that._getInstanceIndex(id);
                if (!that.carsList[id]) {
                  return;
                }
                const url = that.carsList[id].url;
                if (index > -1) {
                  that._instanceMap[url].removeData(index);
                }
                delete that.carsList[id];
              }, 100);
            }
          }
        }
      }
    );
    player.play();
  }

  _getInstanceIndex(id: string) {
    const car = this.carsList[id];
    if (!car) {
      return -1;
    }
    const url = car.url;
    const datas = this._instanceMap[url].getAllData();
    const index = datas.indexOf(this.carsList[id]);
    return index;
  }

  _removeCar(id: string) {
    const ids = id.substring(3);
    if (this.carsList[ids] != null) {
      this.showHideCar(this.carsList[ids], "hide", ids);
    }
  }

  /**
   * 获取瞬时速度。
   *
   * @english
   * Get instant speed.
   * @return instant speed
   */
  get instantSpeed() {
    const speeds = Object.values(this.cars.all()).map((car: Car) => {
      return car.speed;
    });
    if (speeds.length === 0) {
      return 0;
    }
    return (
      speeds.reduce(function (a, b) {
        return a + b;
      }) / speeds.length
    );
  }

  get map() {
    const groupgllayer = this._groupgllayer;
    if (groupgllayer) {
      return groupgllayer.getMap();
    }
    return null;
  }

  /**
   * 图层添加到 GroupGlLayer。
   *
   * @english
   * Add the layer to groupGlLayer.
   * @param symbols - symbols of gltf markers
   * @return void
   */
  addTo(groupgllayer: any) {
    this._groupgllayer = groupgllayer;
    this._carlayer.addTo(groupgllayer);
  }

  /**
   * 整体设置图层上的数据信息。
   *
   * @english
   * Overall setting of data information on layers.
   * @return cars number
   */
  set(obj?: any) {
    if (obj == null) {
      obj = {};
    }
    this.intersections = new Pool(Intersection, obj.intersections);
    this.roads = new Pool(Road, obj.roads);
    this.cars = new Pool(Car, obj.cars);
    return (this.carsNumber = 0);
  }

  /**
   * 保存当前图层数据信息到localStorage。
   *
   * @english
   * Save this layer data info to localStorage.
   * @return data string
   */
  save() {
    const data = Object.assign({}, this);
    delete data.cars;
    return (window.localStorage.world = JSON.stringify(data));
  }

  /**
   * 设置车辆模型数量。
   *
   * @english
   * Set the number of car models.
   * @param num - number of cars
   * @return void
   */
  setCarNumber(num: number) {
    this.carsNumber = num;
  }

  /**
   * 获取车辆模型数量。
   *
   * @english
   * Get the number of car models.
   * @return cars number
   */
  getCarNumber() {
    return this.carsNumber;
  }

  load() {
    let data, id, intersection, road;
    data = window.localStorage.world;
    data = data && JSON.parse(data);
    if (data == null) {
      return null;
    }
    this.clear();
    this.carsNumber = data.carsNumber || 0;
    const ref = data.intersections;
    for (id in ref) {
      intersection = ref[id];
      this.addIntersection(Intersection.copy(intersection));
    }
    const ref1 = data.roads;
    const results = [];
    for (id in ref1) {
      road = ref1[id];
      road = new Road().copy(road);
      road.source = this.getIntersection(road.source);
      road.target = this.getIntersection(road.target);
      results.push(this.addRoad(road));
    }
    return results;
  }

  /**
   * 设置交叉路段。
   *
   * @english
   * Set a intersect segment.
   * @param segment - segment data
   * @param line - line data
   * @return intersect data info
   */
  intersectSegment(segment, line) {
    for (let i = 0; i < line.length - 1; i++) {
      const lineSegment = [line[i], line[i + 1]];
      const turfSegment = turf.lineString(lineSegment);
      const result = turf.lineIntersect(segment, turfSegment);
      if (!result.features.length) {
        continue;
      }
      return {
        intersectIndex: i,
        coord: result.features[0].geometry.coordinates,
      };
    }
    return null;
  }

  intersection(
    segment,
    compareLineIndex,
    segmentIndex,
    lines,
    intersectPoints,
    lineLengthMap
  ) {
    const turfSegment = turf.lineString(segment);
    for (let i = compareLineIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const result = this.intersectSegment(turfSegment, line);

      if (!result) {
        continue;
      }
      const inLines = {};
      inLines[compareLineIndex] = { pre: segmentIndex };
      inLines[i] = { pre: result.intersectIndex + lineLengthMap[i] };
      const point = {
        inLines,
        coordinate: this.map.coordinateToPointAtRes(
          { x: result.coord[0], y: result.coord[1] },
          this.map.getGLRes()
        ),
      };
      intersectPoints.push(point);
    }
  }

  /**
   * 生成交通数据。
   *
   * @english
   * Generate traffic data.
   * @param lines - line data to generate traffic
   * @return void
   */
  generateTraffic(lines) {
    if (!this.map) {
      return;
    }
    const lineLengthMap = {};
    let lengthFlag = 0;
    for (let i = 0; i < lines.length; i++) {
      lineLengthMap[i] = lengthFlag;
      lengthFlag = lengthFlag + lines[i].length;
    }
    const intersectPoints = [];
    let intersectCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const compareLine = lines[i];
      for (let j = 0; j < compareLine.length - 1; j++) {
        const segment = [compareLine[j], compareLine[j + 1]];
        this.intersection(
          segment,
          i,
          intersectCount + j,
          lines,
          intersectPoints,
          lineLengthMap
        );
      }
      intersectCount = intersectCount + compareLine.length;
    }

    const Points = [];
    let count = 0;
    const map = this.map;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (let j = 0; j < line.length; j++) {
        const coordinate = map.coordinateToPointAtRes(
          { x: line[j][0], y: line[j][1] },
          map.getGLRes()
        );
        const inLines = {};
        if (j === 0) {
          inLines[i] = { pre: null };
        } else if (j === line.length - 1) {
          inLines[i] = { pre: j - 1 + count };
        } else {
          inLines[i] = { pre: j - 1 + count };
        }
        const point = {
          inLines,
          coordinate,
        };
        Points.push(point);
      }
      count = count + line.length;
    }
    for (let i = 0; i < Points.length; i++) {
      const point = Points[i];
      this.comparePrePoint(point, i, intersectPoints);
    }

    const gridSize = this.gridSize;
    const step = gridSize;
    const intersections_Points = [];
    for (let i = 0; i < Points.length; i++) {
      const point = Points[i];
      const x = point.coordinate.x,
        y = point.coordinate.y;
      const rect = new Rect(x * step - 0.5, y * step - 0.5, 1, 1);
      const intersection = new Intersection(rect);
      intersection.connectRoads = point.roads;
      intersections_Points.push(intersection);
      this.addIntersection(intersection);
    }
    const intersections_intersectPoints = [];
    for (let i = 0; i < intersectPoints.length; i++) {
      const point = intersectPoints[i];
      const x = point.coordinate.x,
        y = point.coordinate.y;
      const rect = new Rect(x * step - 0.5, y * step - 0.5, 1, 1);
      const intersection = new Intersection(rect);
      intersection.connectRoads = point.roads;
      intersections_intersectPoints.push(intersection);
      this.addIntersection(intersection);
    }
    for (let i = 0; i < intersections_Points.length; i++) {
      const intersection = intersections_Points[i];
      const roads = intersection.connectRoads;
      if (!roads) {
        continue;
      }
      for (let r = 0; r < roads.length; r++) {
        const road = roads[r];
        if (road.pre != null) {
          let preRoad = null;
          const type = road.type;
          if (type === "line") {
            preRoad = intersections_Points[road.pre];
          } else if (type === "line-interact") {
            preRoad = intersections_intersectPoints[road.pre];
          }
          this.addRoad(new Road(intersection, preRoad));
          this.addRoad(new Road(preRoad, intersection));
        }
      }
    }

    for (let i = 0; i < intersections_intersectPoints.length; i++) {
      const intersection = intersections_intersectPoints[i];
      const roads = intersection.connectRoads;
      if (!roads) {
        continue;
      }
      for (let r = 0; r < roads.length; r++) {
        const road = roads[r];
        if (road.pre != null) {
          let preRoad = null;
          const type = road.type;
          if (type === "line") {
            preRoad = intersections_Points[road.pre];
          } else if (type === "line-interact") {
            preRoad = intersections_intersectPoints[road.pre];
          }
          this.addRoad(new Road(intersection, preRoad));
          this.addRoad(new Road(preRoad, intersection));
        }
      }
    }
  }

  /**
   * 比较当前点数据和前一个点数据。
   *
   * @english
   * Compare current point and pre point.
   * @param point - point data
   * @param index - data index
   * @param intersectPoints - intersect points data
   * @return void
   */
  comparePrePoint(point, index, intersectPoints) {
    const preInfo = this.getPre(point);
    if (preInfo) {
      const { pre, lineIndex } = preInfo;
      for (let i = 0; i < intersectPoints.length; i++) {
        const intersectPoint = intersectPoints[i];
        if (
          intersectPoint.inLines[lineIndex] &&
          intersectPoint.inLines[lineIndex].pre === pre
        ) {
          point.roads = [{ pre: i, type: "line-interact" }];
          if (!intersectPoint.roads) {
            intersectPoint.roads = [{ pre: index - 1, type: "line" }];
          } else {
            intersectPoint.roads.push({ pre: index - 1, type: "line" });
          }
        }
      }
      if (!point.roads) {
        point.roads = [{ pre: index - 1, type: "line" }];
      }
    }
  }

  /**
   * 获取前一个数据。
   *
   * @english
   * Get pre data.
   * @param point - point data
   * @return pre data
   */
  getPre(point) {
    for (const lineIndex in point.inLines) {
      if (point.inLines[lineIndex].pre !== null) {
        return { pre: point.inLines[lineIndex].pre, lineIndex };
      }
    }
    return null;
  }

  /**
   * 刷新车辆。
   *
   * @english
   * Refresh cars added in layer.
   * @return car
   */
  clear() {
    return this.set({});
  }

  onTick(delta: number) {
    let car, id, intersection;
    if (delta > 1) throw Error("delta > 1");
    this.refreshCars();
    const ref = this.intersections.all();
    for (id in ref) {
      intersection = ref[id];
      intersection.controlSignals.onTick(delta);
    }
    const ref1 = this.cars.all();
    const results = [];
    for (id in ref1) {
      car = ref1[id];
      car.move(delta);
      if (!car.alive) results.push(this.removeCar(car));
      else results.push(void 0);
    }
    return results;
  }

  /**
   * 刷新车辆。
   *
   * @english
   * Refresh cars added in layer.
   * @return car
   */
  refreshCars() {
    if (this.cars.length < this.carsNumber) {
      this.addRandomCar();
    }
    if (this.cars.length > this.carsNumber) {
      return this.removeRandomCar();
    }
    return null;
  }

  /**
   * 添加道路。
   *
   * @english
   * Add a road.
   * @param road - road data
   * @return road
   */
  addRoad(road: Road) {
    this.roads.put(road);
    road.source.roads.push(road);
    road.target.inRoads.push(road);
    return road.update();
  }

  /**
   * 根据id获取道路数据。
   *
   * @english
   * Get a road info by id.
   * @param id - road id
   * @return road
   */
  getRoad(id: string) {
    return this.roads.get(id);
  }

  /**
   * 添加车辆模型。
   *
   * @english
   * Add a car model.
   * @param car - car model
   * @return car
   */
  addCar(car: Car) {
    return this.cars.put(car);
  }

  /**
   * 根据id获取车辆信息。
   *
   * @english
   * Get a car info by id.
   * @param id - model id
   * @return car
   */
  getCar(id: string) {
    return this.cars.get(id);
  }

  /**
   * 移除车辆模型。
   *
   * @english
   * Remove a car.
   * @param car - car model
   * @return car
   */
  removeCar(car: Car) {
    this.toRemove.push(car.id);
    return this.cars.pop(car);
  }

  /**
   * 清空临时移除项目。
   *
   * @english
   * Empty temporary removal items.
   * @return void
   */
  clearTmpRemove() {
    this.toRemove = [];
  }

  /**
   * 添加交叉路口。
   *
   * @english
   * Add a intersection.
   * @param intersection - intersection data
   * @return intersection
   */
  addIntersection(intersection: Intersection) {
    return this.intersections.put(intersection);
  }

  /**
   * 根据id获取交叉路口信息。
   *
   * @english
   * Get a intersection info by id.
   * @param id - intersection id
   * @return intersection
   */
  getIntersection(id: string) {
    return this.intersections.get(id);
  }

  /**
   * 添加一个随机车辆模型。
   *
   * @english
   * Add a random car model.
   * @return car
   */
  addRandomCar() {
    let lane: Lane;
    const road = sample(this.roads.all());
    if (road != null) {
      lane = sample(road.lanes);
      if (lane != null) {
        return this.addCar(new Car(lane));
      }
    }
    return null;
  }

  /**
   * 移除一个随机车辆模型。
   *
   * @english
   * Remove a random car model.
   * @return car
   */
  removeRandomCar() {
    const car = sample(this.cars.all());
    if (car != null) {
      return this.removeCar(car);
    }
    return null;
  }
}
