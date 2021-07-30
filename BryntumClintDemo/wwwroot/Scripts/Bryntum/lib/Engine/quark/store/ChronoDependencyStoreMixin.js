import { Mixin } from "../../../ChronoGraph/class/BetterMixin.js";
import { ChronoPartOfProjectStoreMixin } from "./mixin/ChronoPartOfProjectStoreMixin.js";
import { AbstractDependencyStoreMixin } from "./AbstractDependencyStoreMixin.js";
export class ChronoDependencyStoreMixin extends Mixin([AbstractDependencyStoreMixin, ChronoPartOfProjectStoreMixin], (base) => {
    const superProto = base.prototype;
    class ChronoDependencyStoreMixin extends base {
        set data(value) {
            this.allDependenciesForRemoval = true;
            super.data = value;
            this.allDependenciesForRemoval = false;
        }
    }
    return ChronoDependencyStoreMixin;
}) {
}
