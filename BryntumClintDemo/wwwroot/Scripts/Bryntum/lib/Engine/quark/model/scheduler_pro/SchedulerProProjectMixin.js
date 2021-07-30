var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ProposedOrPrevious } from "../../../../ChronoGraph/chrono/Effect.js";
import { Mixin } from "../../../../ChronoGraph/class/BetterMixin.js";
import { CI } from "../../../../ChronoGraph/collection/Iterator.js";
import { model_field } from "../../../chrono/ModelFieldAtom.js";
import { DependenciesCalendar, DependencyValidationResult, ProjectType } from "../../../scheduling/Types.js";
import { SchedulerBasicProjectMixin } from "../scheduler_basic/SchedulerBasicProjectMixin.js";
import { ConstrainedEarlyEventMixin } from "./ConstrainedEarlyEventMixin.js";
import { SchedulerProDependencyMixin } from "./SchedulerProDependencyMixin.js";
import { SchedulerProEvent } from "./SchedulerProEvent.js";
import { SchedulerProAssignmentMixin } from "./SchedulerProAssignmentMixin.js";
import { SchedulerProResourceMixin } from "./SchedulerProResourceMixin.js";
export class SchedulerProProjectMixin extends Mixin([SchedulerBasicProjectMixin, ConstrainedEarlyEventMixin], (base) => {
    const superProto = base.prototype;
    class SchedulerProProjectMixin extends base {
        *calculateDirection() {
            return yield ProposedOrPrevious;
        }
        getType() {
            return ProjectType.SchedulerPro;
        }
        getDefaultEventModelClass() {
            return SchedulerProEvent;
        }
        getDefaultDependencyModelClass() {
            return SchedulerProDependencyMixin;
        }
        getDefaultAssignmentModelClass() {
            return SchedulerProAssignmentMixin;
        }
        getDefaultResourceModelClass() {
            return SchedulerProResourceMixin;
        }
        async validateDependency(fromEvent, toEvent, type, ignoreDependency) {
            let ingoredDependencies;
            if (ignoreDependency) {
                ingoredDependencies = Array.isArray(ignoreDependency) ? ignoreDependency : [ignoreDependency];
            }
            const alreadyLinked = CI(fromEvent.outgoingDeps).some((dependency) => dependency.toEvent === toEvent && !(ingoredDependencies === null || ingoredDependencies === void 0 ? void 0 : ingoredDependencies.includes(dependency)));
            if (alreadyLinked)
                return DependencyValidationResult.DuplicatingDependency;
            if (await this.isDependencyCyclic(fromEvent, toEvent, type, ingoredDependencies)) {
                return DependencyValidationResult.CyclicDependency;
            }
            return DependencyValidationResult.NoError;
        }
        async isValidDependency(fromEvent, toEvent, type, ignoreDependency) {
            const validationResult = await this.validateDependency(fromEvent, toEvent, type, ignoreDependency);
            return validationResult === DependencyValidationResult.NoError;
        }
        async isDependencyCyclic(fromEvent, toEvent, type, ignoreDependency) {
            const dependencyClass = this.getDependencyStore().modelClass;
            const dependency = new dependencyClass({ fromEvent, toEvent, type });
            const branch = this.replica.branch({ autoCommit: false, onComputationCycle: 'throw' });
            if (ignoreDependency) {
                if (!Array.isArray(ignoreDependency)) {
                    ignoreDependency = [ignoreDependency];
                }
                ignoreDependency.forEach(dependency => branch.removeEntity(dependency));
            }
            branch.addEntity(dependency);
            dependency.project = this;
            try {
                await branch.readAsync(toEvent.$.earlyStartDateConstraintIntervals);
                await branch.readAsync(toEvent.$.earlyEndDateConstraintIntervals);
                return false;
            }
            catch (e) {
                if (/cycle/i.test(e))
                    return true;
                throw e;
            }
        }
        async isValidDependencyModel(dependency, ignoreDependencies) {
            return this.isValidDependency(dependency.fromEvent, dependency.toEvent, dependency.type, ignoreDependencies);
        }
    }
    __decorate([
        model_field({ type: 'string', defaultValue: DependenciesCalendar.ToEvent })
    ], SchedulerProProjectMixin.prototype, "dependenciesCalendar", void 0);
    __decorate([
        model_field({ type: 'boolean', defaultValue: true })
    ], SchedulerProProjectMixin.prototype, "autoCalculatePercentDoneForParentTasks", void 0);
    return SchedulerProProjectMixin;
}) {
}
