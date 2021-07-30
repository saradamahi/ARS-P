var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Reject } from "../../../../ChronoGraph/chrono/Effect.js";
import { Mixin } from "../../../../ChronoGraph/class/BetterMixin.js";
import { calculate, field } from "../../../../ChronoGraph/replica/Entity.js";
import { CalendarIteratorResult } from "../../../calendar/CalendarCache.js";
import { TimeUnit } from "../../../scheduling/Types.js";
import { BaseHasAssignmentsMixin } from "../scheduler_basic/BaseHasAssignmentsMixin.js";
export class SchedulerProHasAssignmentsMixin extends Mixin([BaseHasAssignmentsMixin], (base) => {
    const superProto = base.prototype;
    class SchedulerProHasAssignmentsMixin extends base {
        async assign(resource, units = 100) {
            if (this.getAssignmentFor(resource))
                throw new Error('Resource can\'t be assigned twice to the same task');
            const assignmentCls = this.getProject().assignmentStore.modelClass;
            this.addAssignment(new assignmentCls({
                event: this,
                resource: resource,
                units: units
            }));
            return this.commitAsync();
        }
        *forEachAvailabilityInterval(options, func) {
            const calendar = yield this.$.effectiveCalendar;
            const assignmentsByCalendar = yield this.$.assignmentsByCalendar;
            const effectiveCalendarsCombination = yield this.$.effectiveCalendarsCombination;
            return effectiveCalendarsCombination.forEachAvailabilityInterval(options, (startDate, endDate, calendarCacheIntervalMultiple) => {
                const calendarsStatus = calendarCacheIntervalMultiple.getCalendarsWorkStatus();
                const workCalendars = calendarCacheIntervalMultiple.getCalendarsWorking();
                if (calendarsStatus.get(calendar)
                    &&
                        (options.ignoreResourceCalendars || workCalendars.some((calendar) => assignmentsByCalendar.has(calendar)))) {
                    return func(startDate, endDate, calendarCacheIntervalMultiple);
                }
            });
        }
        *calculateEffectiveCalendarsCombination() {
            const assignmentsByCalendar = yield this.$.assignmentsByCalendar;
            const calendars = [...assignmentsByCalendar.keys(), yield this.$.effectiveCalendar];
            return this.getProject().combineCalendars(calendars);
        }
        *calculateAssignmentsByCalendar() {
            const assignments = yield this.$.assigned;
            const result = new Map();
            for (const assignment of assignments) {
                const resource = yield assignment.$.resource;
                if (resource) {
                    const resourceCalendar = yield resource.$.effectiveCalendar;
                    let assignments = result.get(resourceCalendar);
                    if (!assignments) {
                        assignments = [];
                        result.set(resourceCalendar, assignments);
                    }
                    assignments.push(assignment);
                }
            }
            return result;
        }
        *getBaseOptionsForDurationCalculations() {
            return { ignoreResourceCalendars: false };
        }
        *skipNonWorkingTime(date, isForward = true) {
            if (!date)
                return null;
            const assignmentsByCalendar = yield this.$.assignmentsByCalendar;
            if (assignmentsByCalendar.size > 0) {
                const options = Object.assign(yield* this.getBaseOptionsForDurationCalculations(), isForward ? { startDate: date, isForward } : { endDate: date, isForward });
                let workingDate;
                const skipRes = yield* this.forEachAvailabilityInterval(options, (startDate, endDate, calendarCacheIntervalMultiple) => {
                    workingDate = isForward ? startDate : endDate;
                    return false;
                });
                if (skipRes === CalendarIteratorResult.MaxRangeReached || skipRes === CalendarIteratorResult.FullRangeIterated) {
                    yield Reject("Empty calendar");
                }
                return new Date(workingDate);
            }
            else {
                return yield* superProto.skipNonWorkingTime.call(this, date, isForward);
            }
        }
        *calculateProjectedDuration(startDate, endDate, durationUnit) {
            if (!startDate || !endDate) {
                return null;
            }
            const assignmentsByCalendar = yield this.$.assignmentsByCalendar;
            if (assignmentsByCalendar.size > 0) {
                const options = Object.assign(yield* this.getBaseOptionsForDurationCalculations(), { startDate, endDate, isForward: true });
                let result = 0;
                yield* this.forEachAvailabilityInterval(options, (startDate, endDate) => {
                    result += endDate.getTime() - startDate.getTime();
                });
                if (!durationUnit)
                    durationUnit = yield this.$.durationUnit;
                return yield* this.getProject().$convertDuration(result, TimeUnit.Millisecond, durationUnit);
            }
            else {
                return yield* superProto.calculateProjectedDuration.call(this, startDate, endDate, durationUnit);
            }
        }
        *calculateProjectedXDateWithDuration(baseDate, isForward = true, duration) {
            if (duration == null || isNaN(duration) || baseDate == null)
                return null;
            if (duration == 0)
                return baseDate;
            const durationUnit = yield this.$.durationUnit;
            const durationMS = yield* this.getProject().$convertDuration(duration, durationUnit, TimeUnit.Millisecond);
            let resultN = baseDate.getTime();
            let leftDuration = durationMS;
            const calendar = yield this.$.effectiveCalendar;
            const assignmentsByCalendar = yield this.$.assignmentsByCalendar;
            if (assignmentsByCalendar.size > 0) {
                const options = Object.assign(yield* this.getBaseOptionsForDurationCalculations(), isForward ? { startDate: baseDate, isForward } : { endDate: baseDate, isForward });
                yield* this.forEachAvailabilityInterval(options, (intervalStart, intervalEnd, calendarCacheIntervalMultiple) => {
                    const intervalStartN = intervalStart.getTime(), intervalEndN = intervalEnd.getTime(), intervalDuration = intervalEndN - intervalStartN;
                    if (intervalDuration >= leftDuration) {
                        resultN = isForward ? intervalStartN + leftDuration : intervalEndN - leftDuration;
                        return false;
                    }
                    else {
                        const dstDiff = intervalStart.getTimezoneOffset() - intervalEnd.getTimezoneOffset();
                        leftDuration -= intervalDuration + dstDiff * 60 * 1000;
                    }
                });
                return new Date(resultN);
            }
            else {
                return calendar.accumulateWorkingTime(baseDate, durationMS, isForward).finalDate;
            }
        }
    }
    __decorate([
        field()
    ], SchedulerProHasAssignmentsMixin.prototype, "effectiveCalendarsCombination", void 0);
    __decorate([
        field()
    ], SchedulerProHasAssignmentsMixin.prototype, "assignmentsByCalendar", void 0);
    __decorate([
        calculate('effectiveCalendarsCombination')
    ], SchedulerProHasAssignmentsMixin.prototype, "calculateEffectiveCalendarsCombination", null);
    __decorate([
        calculate('assignmentsByCalendar')
    ], SchedulerProHasAssignmentsMixin.prototype, "calculateAssignmentsByCalendar", null);
    return SchedulerProHasAssignmentsMixin;
}) {
}
