import { Mixin } from "../../../ChronoGraph/class/Mixin.js";
import { AbstractPartOfProjectStoreMixin } from "./mixin/AbstractPartOfProjectStoreMixin.js";
export class AbstractCalendarManagerStoreMixin extends Mixin([AbstractPartOfProjectStoreMixin], (base) => {
    const superProto = base.prototype;
    class AbstractCalendarManagerStoreMixin extends base {
    }
    return AbstractCalendarManagerStoreMixin;
}) {
}
