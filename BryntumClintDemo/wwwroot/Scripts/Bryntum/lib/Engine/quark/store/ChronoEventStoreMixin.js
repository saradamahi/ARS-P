import { Mixin } from "../../../ChronoGraph/class/BetterMixin.js";
import { SchedulerBasicEvent } from "../model/scheduler_basic/SchedulerBasicEvent.js";
import { ChronoPartOfProjectStoreMixin } from "./mixin/ChronoPartOfProjectStoreMixin.js";
import { AbstractEventStoreMixin } from "./AbstractEventStoreMixin.js";
export class ChronoEventStoreMixin extends Mixin([AbstractEventStoreMixin, ChronoPartOfProjectStoreMixin], (base) => {
    const superProto = base.prototype;
    class ChronoEventStoreMixin extends base {
        static get defaultConfig() {
            return {
                modelClass: SchedulerBasicEvent
            };
        }
        set data(value) {
            super.data = value;
            this.afterEventRemoval();
        }
    }
    return ChronoEventStoreMixin;
}) {
}
export class ChronoEventTreeStoreMixin extends Mixin([ChronoEventStoreMixin], (base) => {
    const superProto = base.prototype;
    class ChronoEventTreeStoreMixin extends base {
        buildRootNode() {
            return this.getProject() || {};
        }
        static get defaultConfig() {
            return {
                tree: true
            };
        }
    }
    return ChronoEventTreeStoreMixin;
}) {
}
