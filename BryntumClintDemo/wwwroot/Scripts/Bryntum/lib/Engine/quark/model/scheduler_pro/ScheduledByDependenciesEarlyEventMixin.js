var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Mixin } from '../../../../ChronoGraph/class/BetterMixin.js';
import { calculate } from '../../../../ChronoGraph/replica/Entity.js';
import { isAtomicValue } from '../../../../ChronoGraph/util/Helpers.js';
import { DateInterval } from '../../../scheduling/DateInterval.js';
import { DependencyType, TimeUnit } from '../../../scheduling/Types.js';
import { HasDependenciesMixin } from "../scheduler_basic/HasDependenciesMixin.js";
import { ConstrainedEarlyEventMixin } from './ConstrainedEarlyEventMixin.js';
export class ScheduledByDependenciesEarlyEventMixin extends Mixin([ConstrainedEarlyEventMixin, HasDependenciesMixin], (base) => {
    const superProto = base.prototype;
    class ScheduledByDependenciesEarlyEventMixin extends base {
        *calculateEarlyStartDateConstraintIntervals() {
            const intervals = yield* superProto.calculateEarlyStartDateConstraintIntervals.call(this);
            const project = this.getProject();
            for (const dependency of (yield this.$.incomingDeps)) {
                const fromEvent = yield dependency.$.fromEvent;
                const isActive = yield dependency.$.active;
                if (fromEvent == null || isAtomicValue(fromEvent) || !isActive)
                    continue;
                let interval;
                switch (yield dependency.$.type) {
                    case DependencyType.EndToStart:
                        const fromEventEndDate = yield fromEvent.$.earlyEndDateRaw;
                        if (fromEventEndDate) {
                            const lag = yield dependency.$.lag;
                            const lagUnit = yield dependency.$.lagUnit;
                            const calendar = yield dependency.$.calendar;
                            interval = DateInterval.new({
                                startDate: calendar.calculateEndDate(fromEventEndDate, yield* project.$convertDuration(lag, lagUnit, TimeUnit.Millisecond)),
                                endDate: null
                            });
                        }
                        break;
                    case DependencyType.StartToStart:
                        const fromEventStartDate = yield fromEvent.$.earlyStartDateRaw;
                        if (fromEventStartDate) {
                            const lag = yield dependency.$.lag;
                            const lagUnit = yield dependency.$.lagUnit;
                            const calendar = yield dependency.$.calendar;
                            interval = DateInterval.new({
                                startDate: calendar.calculateEndDate(fromEventStartDate, yield* project.$convertDuration(lag, lagUnit, TimeUnit.Millisecond)),
                                endDate: null
                            });
                        }
                        break;
                }
                interval && intervals.unshift(interval);
            }
            return intervals;
        }
        *calculateEarlyEndDateConstraintIntervals() {
            const intervals = yield* superProto.calculateEarlyEndDateConstraintIntervals.call(this);
            const project = this.getProject();
            for (const dependency of (yield this.$.incomingDeps)) {
                const fromEvent = yield dependency.$.fromEvent;
                const isActive = yield dependency.$.active;
                if (fromEvent == null || isAtomicValue(fromEvent) || !isActive)
                    continue;
                let interval;
                switch (yield dependency.$.type) {
                    case DependencyType.EndToEnd:
                        const fromEventEndDate = yield fromEvent.$.earlyEndDateRaw;
                        if (fromEventEndDate) {
                            const lag = yield dependency.$.lag;
                            const lagUnit = yield dependency.$.lagUnit;
                            const calendar = yield dependency.$.calendar;
                            interval = DateInterval.new({
                                startDate: calendar.calculateEndDate(fromEventEndDate, yield* project.$convertDuration(lag, lagUnit, TimeUnit.Millisecond)),
                                endDate: null
                            });
                        }
                        break;
                    case DependencyType.StartToEnd:
                        const fromEventStartDate = yield fromEvent.$.earlyStartDateRaw;
                        if (fromEventStartDate) {
                            const lag = yield dependency.$.lag;
                            const lagUnit = yield dependency.$.lagUnit;
                            const calendar = yield dependency.$.calendar;
                            interval = DateInterval.new({
                                startDate: calendar.calculateEndDate(fromEventStartDate, yield* project.$convertDuration(lag, lagUnit, TimeUnit.Millisecond)),
                                endDate: null
                            });
                        }
                        break;
                }
                interval && intervals.unshift(interval);
            }
            return intervals;
        }
    }
    __decorate([
        calculate('earlyEndDateIntervals')
    ], ScheduledByDependenciesEarlyEventMixin.prototype, "calculateEarlyEndDateConstraintIntervals", null);
    return ScheduledByDependenciesEarlyEventMixin;
}) {
}
