import { Mixin } from "../../../ChronoGraph/class/BetterMixin.js";
import { BaseAssignmentMixin } from "../model/scheduler_basic/BaseAssignmentMixin.js";
import { ChronoPartOfProjectStoreMixin } from "./mixin/ChronoPartOfProjectStoreMixin.js";
import { AbstractAssignmentStoreMixin } from "./AbstractAssignmentStoreMixin.js";
export class ChronoAssignmentStoreMixin extends Mixin([AbstractAssignmentStoreMixin, ChronoPartOfProjectStoreMixin], (base) => {
    const superProto = base.prototype;
    class ChronoAssignmentStoreMixin extends base {
        static get defaultConfig() {
            return {
                modelClass: BaseAssignmentMixin
            };
        }
        set data(value) {
            this.allAssignmentsForRemoval = true;
            super.data = value;
            this.allAssignmentsForRemoval = false;
        }
    }
    return ChronoAssignmentStoreMixin;
}) {
}
