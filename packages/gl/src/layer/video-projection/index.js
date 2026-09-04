import VideoProjection from './VideoProjection';
import GroupGLLayer from '../GroupGLLayer';

// 视频投影依赖 GroupGLLayer 的 ground 平面接收/遮挡投影。
// GroundPainter 假定 groundConfig 一定包含 symbol 与 renderPlugin（读取时直接访问
// symbol.ssr、renderPlugin.type），若用户只配置了 ground.enable 而未提供这两项，
// 在渲染地面时会触发空值错误。
// 这里在 video 包加载时对 GroupGLLayer 的 ground 配置做兜底补全
// （symbol: {} / renderPlugin: { type: 'fill' }），与 GroundPainter 无 symbol/renderPlugin
// 时用默认 fill 填充的行为一致，无需侵入 GroundPainter。
if (GroupGLLayer && GroupGLLayer.prototype && GroupGLLayer.prototype.getGroundConfig) {
    const originalGetGroundConfig = GroupGLLayer.prototype.getGroundConfig;
    GroupGLLayer.prototype.getGroundConfig = function () {
        const ground = originalGetGroundConfig.call(this);
        if (ground && ground.enable) {
            if (!ground.symbol) {
                ground.symbol = {};
            }
            if (!ground.renderPlugin) {
                ground.renderPlugin = { type: 'fill' };
            }
        }
        return ground;
    };
}

export { VideoProjection };
