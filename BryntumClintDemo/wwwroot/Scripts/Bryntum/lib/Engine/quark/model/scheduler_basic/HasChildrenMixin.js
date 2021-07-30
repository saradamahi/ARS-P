var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Mixin } from "../../../../ChronoGraph/class/BetterMixin.js";
import { reference } from "../../../../ChronoGraph/replica/Reference.js";
import { bucket } from "../../../../ChronoGraph/replica/ReferenceBucket.js";
import { HasSubEventsMixin } from "./HasSubEventsMixin.js";
export class HasChildrenMixin extends Mixin([HasSubEventsMixin], (base) => {
    const superProto = base.prototype;
    class HasChildrenMixin extends base {
        *hasSubEvents() {
            const childEvents = yield this.$.childEvents;
            return childEvents.size > 0;
        }
        *subEventsIterable() {
            return yield this.$.childEvents;
        }
        get parent() {
            return this._parent;
        }
        set parent(value) {
            this._parent = value;
            this.parentEvent = value;
        }
    }
    __decorate([
        reference({ bucket: 'childEvents' })
    ], HasChildrenMixin.prototype, "parentEvent", void 0);
    __decorate([
        bucket()
    ], HasChildrenMixin.prototype, "childEvents", void 0);
    return HasChildrenMixin;
}) {
}
