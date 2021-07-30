var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Mixin } from "../../../../ChronoGraph/class/BetterMixin.js";
import { field } from "../../../../ChronoGraph/replica/Entity.js";
import { model_field } from "../../../chrono/ModelFieldAtom.js";
import { ChronoPartOfProjectModelMixin } from "../mixin/ChronoPartOfProjectModelMixin.js";
import { AbstractCalendarMixin } from "../AbstractCalendarMixin.js";
const hasMixin = Symbol('CalendarMixin');
export class BaseCalendarMixin extends Mixin([
    AbstractCalendarMixin,
    ChronoPartOfProjectModelMixin
], (base) => {
    const superProto = base.prototype;
    class BaseCalendarMixin extends base {
        constructor() {
            super(...arguments);
            this.version = 1;
        }
        [hasMixin]() { }
    }
    __decorate([
        field({ persistent: false })
    ], BaseCalendarMixin.prototype, "version", void 0);
    __decorate([
        model_field({ type: 'string' })
    ], BaseCalendarMixin.prototype, "name", void 0);
    __decorate([
        model_field({ type: 'boolean', defaultValue: true })
    ], BaseCalendarMixin.prototype, "unspecifiedTimeIsWorking", void 0);
    __decorate([
        model_field()
    ], BaseCalendarMixin.prototype, "intervals", void 0);
    return BaseCalendarMixin;
}) {
}
