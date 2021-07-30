var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Mixin } from '../../../../ChronoGraph/class/BetterMixin.js';
import { model_field } from '../../../chrono/ModelFieldAtom.js';
import { BaseAssignmentMixin } from '../scheduler_basic/BaseAssignmentMixin.js';
export class SchedulerProAssignmentMixin extends Mixin([BaseAssignmentMixin], (base) => {
    const superProto = base.prototype;
    class SchedulerProAssignmentMixin extends base {
    }
    __decorate([
        model_field({ type: 'number', defaultValue: 100 })
    ], SchedulerProAssignmentMixin.prototype, "units", void 0);
    return SchedulerProAssignmentMixin;
}) {
}
