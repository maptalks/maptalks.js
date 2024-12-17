import { requestAnimFrame } from './util';
import { isFunction, isNil, isNumber, now } from './util/common';
import { getGlobalWorkerPool } from './worker/WorkerPool';
import Browser from './Browser';
import GlobalConfig from '../GlobalConfig';

type runFunction = () => any;

type TaskCreateItem = runFunction | { count?: number, run: runFunction }

type TaskItem = {
    count: number;
    run: runFunction;
    resolve: (...args) => void;
    results: Array<any>;
}

let tasks: TaskItem[] = [];
const loopHooks = [];

/**
 *
 * @param {Object|Function} task  - a micro task(Promise)
 * @param {Number} task.count - task run count
 * @param {Function} task.run - task run function
 * @return {Promise}
 * @example
 * const run =()=>{
 * //do some things
 * };
 * runTaskAsync({count:4,run}).then(result=>{})
 * runTaskAsync(run).then(result=>{})
 */
export function runTaskAsync(task: TaskCreateItem) {
    startTasks();
    const promise = new Promise<any>((resolve, reject) => {
        if (!task) {
            reject(new Error('task is null'));
            return;
        }
        if (isFunction(task)) {
            task = { count: 1, run: task };
        }
        if (!task.run) {
            reject(new Error('task.run is null'));
            return;
        }
        if (isNil(task.count)) {
            task.count = 1;
        }
        task.count = Math.ceil(task.count);
        if (!isNumber(task.count)) {
            reject(new Error('task.count is not number'));
            return;
        }
        const taskItem = task as TaskItem;
        taskItem.results = [];
        tasks.push(taskItem);
        taskItem.resolve = resolve;
    });
    return promise;
}

function executeMicroTasks() {
    if (tasks.length === 0) {
        return;
    }
    const runingTasks = [], endTasks = [];
    let len = tasks.length;
    for (let i = 0; i < len; i++) {
        const task = tasks[i];
        task.count--;
        if (task.count === -1) {
            endTasks.push(task);
        } else {
            runingTasks.push(task);
            const result = task.run();
            task.results.push(result);
        }
    }
    tasks = runingTasks;
    len = endTasks.length;
    for (let i = 0; i < len; i++) {
        const task = endTasks[i];
        if (task.resolve) {
            task.resolve(task.results);
        }
    }
}

function loop(isBusy?: boolean) {
    const messageRatio = GlobalConfig.messagePostRatioPerWorker * (isBusy ? 0.5 : 1);
    getGlobalWorkerPool().commit();
    getGlobalWorkerPool().broadcastIdleMessage(messageRatio);
    executeMicroTasks();
    loopHooks.forEach(func => {
        func();
    });
}

let idleCallTime = now();
function idleFrameLoop() {
    loop();
    idleCallTime = now();
    requestIdleCallback(idleFrameLoop);
}

function animFrameLoop() {
    if (Browser.requestIdleCallback) {
        const { idleForceTimeThreshold, idleLog } = GlobalConfig;
        const time = now();
        if (time - idleCallTime > idleForceTimeThreshold) {
            loop(true);
            idleCallTime = now();
            if (idleLog) {
                console.warn(`did not apply for availability, forced run idle`);
            }
        }
    } else {
        loop();
    }
    requestAnimFrame(animFrameLoop);
}

let started = false;
export function startTasks() {
    if (started) {
        return;
    }
    started = true;
    if (Browser.requestIdleCallback) {
        requestIdleCallback(idleFrameLoop);
    }
    //always run requestAnimFrame
    requestAnimFrame(animFrameLoop);
}

export function pushLoopHook(func) {
    if (loopHooks.indexOf(func) > -1) {
        return;
    }
    if (isFunction(func)) {
        loopHooks.push(func);
    }
}
