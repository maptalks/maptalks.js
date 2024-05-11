import { getGlobalThis } from "./core/util/env";

/**
 * global config
 * idle/worker etc
 */
const GlobalConfig = {
    //test env
    isTest: false,

    idleEnable: true,
    //idle logging
    idleLog: false,
    //idle 时间阈值
    idleTimeRemaining: 4,
    //idle 申请不到idle时,强制执行时间阈值
    idleForceTimeThreshold: 100,
    //idle 超时阈值
    idleTimeout: 1000,
    //worker 数量
    workerCount: (getGlobalThis().MAPTALKS_WORKER_COUNT) as number || 0,
    //每个Worker Message中封装的task message数量
    taskCountPerWorkerMessage: 5,
    //当前运行环境的最大FPS,用户可以手动配置，否则将自动检测并赋值,为地图锁帧渲染准备
    maxFPS: 0
};
export default GlobalConfig;
