import { Mixin } from "../../../ChronoGraph/class/BetterMixin.js";
import { BaseCalendarMixin } from "../model/scheduler_basic/BaseCalendarMixin.js";
import { ChronoPartOfProjectStoreMixin } from "./mixin/ChronoPartOfProjectStoreMixin.js";
import { AbstractCalendarManagerStoreMixin } from "./AbstractCalendarManagerStoreMixin.js";
export class ChronoCalendarManagerStoreMixin extends Mixin([AbstractCalendarManagerStoreMixin, ChronoPartOfProjectStoreMixin], (base) => {
    const superProto = base.prototype;
    class ChronoCalendarManagerStoreMixin extends base {
        static get defaultConfig() {
            return {
                tree: true,
                modelClass: BaseCalendarMixin
            };
        }
    }
    return ChronoCalendarManagerStoreMixin;
}) {
}
