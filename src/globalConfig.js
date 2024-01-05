/**
 * global config
 * idle/worker etc
 */
const globalConfig = {
    idleLog: false,
    //idle 时间阈值
    idleTimeRemaining: 8,
    //idle 超时阈值
    idleTimeout: 1000,
    //worker 数量
    workerCount: 0,
    //worker 通信并发数量
    workerConcurrencyCount: 5
};
export default globalConfig;
