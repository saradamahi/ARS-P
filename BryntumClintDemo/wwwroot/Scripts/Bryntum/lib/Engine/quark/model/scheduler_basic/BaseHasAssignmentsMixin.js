var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Mixin } from "../../../../ChronoGraph/class/BetterMixin.js";
import { generic_field } from "../../../../ChronoGraph/replica/Entity.js";
import { ModelBucketField } from "../../../chrono/ModelFieldAtom.js";
import { BaseEventMixin } from "./BaseEventMixin.js";
import { AbstractHasAssignmentsMixin } from '../AbstractHasAssignmentsMixin.js';
export class BaseHasAssignmentsMixin extends Mixin([BaseEventMixin, AbstractHasAssignmentsMixin], (base) => {
    const superProto = base.prototype;
    class BaseHasAssignmentsMixin extends base {
        get assignments() {
            return this.assigned ? [...this.assigned] : [];
        }
    }
    __decorate([
        generic_field({}, ModelBucketField)
    ], BaseHasAssignmentsMixin.prototype, "assigned", void 0);
    return BaseHasAssignmentsMixin;
}) {
}
