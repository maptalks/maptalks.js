
type Constructor = new (...args: any[]) => {};

export default function MixinExtend<TBase extends Constructor>(Base: TBase) {
    return class extends Base{};
}
