var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Mixin } from '../../../../ChronoGraph/class/BetterMixin.js';
import { generic_field } from '../../../../ChronoGraph/replica/Entity.js';
import { model_field, ModelReferenceField, isSerializableEqual } from '../../../chrono/ModelFieldAtom.js';
import { DependencyType } from '../../../scheduling/Types.js';
import { ChronoPartOfProjectModelMixin } from '../mixin/ChronoPartOfProjectModelMixin.js';
export class BaseDependencyMixin extends Mixin([ChronoPartOfProjectModelMixin], (base) => {
    const superProto = base.prototype;
    class BaseDependencyMixin extends base {
    }
    __decorate([
        generic_field({
            bucket: 'outgoingDeps',
            resolver: function (id) { return this.getEventById(id); },
            modelFieldConfig: {
                persist: true,
                serialize: event => event === null || event === void 0 ? void 0 : event.id,
                isEqual: isSerializableEqual
            },
        }, ModelReferenceField)
    ], BaseDependencyMixin.prototype, "fromEvent", void 0);
    __decorate([
        generic_field({
            bucket: 'incomingDeps',
            resolver: function (id) { return this.getEventById(id); },
            modelFieldConfig: {
                persist: true,
                serialize: event => event === null || event === void 0 ? void 0 : event.id,
                isEqual: isSerializableEqual
            },
        }, ModelReferenceField)
    ], BaseDependencyMixin.prototype, "toEvent", void 0);
    __decorate([
        model_field({ type: 'int', defaultValue: DependencyType.EndToStart })
    ], BaseDependencyMixin.prototype, "type", void 0);
    return BaseDependencyMixin;
}) {
}
