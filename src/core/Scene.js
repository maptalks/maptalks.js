
/**
 * scene结构组成
 * -scene是model的容器，并可设置
 * -scene是light的容器
 * 由light决定场景是否需要
 * -1.漫反射
 * -2.镜面反射
 * -3....
 * 由model决定，场景内是否开启
 * -1.depth
 * -2.stencil
 * -3....
 * 最后，将汇总后的gl状态设置递交给render,由render顺序执行
 */
class Scene{

}