import TrafficScene from "../TrafficScene";

declare global {
    interface Window {
        maptalks: {
            TrafficScene: typeof TrafficScene;
        };
    }
}

export {};
