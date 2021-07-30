var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Mixin } from '../../../../ChronoGraph/class/BetterMixin.js';
import { generic_field } from "../../../../ChronoGraph/replica/Entity.js";
import { ModelBucketField } from '../../../chrono/ModelFieldAtom.js';
import { ChronoPartOfProjectModelMixin } from '../mixin/ChronoPartOfProjectModelMixin.js';
import { HasCalendarMixin } from './HasCalendarMixin.js';
export class BaseResourceMixin extends Mixin([HasCalendarMixin, ChronoPartOfProjectModelMixin], (base) => {
    const superProto = base.prototype;
    class BaseResourceMixin extends base {
        get assignments() {
            return [...this.assigned];
        }
        leaveProject(isReplacing = false) {
            if (this.assigned && !isReplacing) {
                const resourceStore = this.getResourceStore();
                this.assigned.forEach(assignment => resourceStore.assignmentsForRemoval.add(assignment));
            }
            superProto.leaveProject.call(this);
        }
    }
    __decorate([
        generic_field({}, ModelBucketField)
    ], BaseResourceMixin.prototype, "assigned", void 0);
    return BaseResourceMixin;
}) {
}
