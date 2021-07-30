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
export class HasDependenciesMixin extends Mixin([BaseEventMixin], (base) => {
    const superProto = base.prototype;
    class HasDependenciesMixin extends base {
        leaveProject() {
            const eventStore = this.getEventStore();
            if (this.outgoingDeps) {
                this.outgoingDeps.forEach(dependency => eventStore.dependenciesForRemoval.add(dependency));
            }
            if (this.incomingDeps) {
                this.incomingDeps.forEach(dependency => eventStore.dependenciesForRemoval.add(dependency));
            }
            superProto.leaveProject.call(this);
        }
    }
    __decorate([
        generic_field({}, ModelBucketField)
    ], HasDependenciesMixin.prototype, "outgoingDeps", void 0);
    __decorate([
        generic_field({}, ModelBucketField)
    ], HasDependenciesMixin.prototype, "incomingDeps", void 0);
    return HasDependenciesMixin;
}) {
}
