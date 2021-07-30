var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Reject } from "../../../../ChronoGraph/chrono/Effect.js";
import { Mixin } from '../../../../ChronoGraph/class/BetterMixin.js';
import { calculate, field } from '../../../../ChronoGraph/replica/Entity.js';
import { ConflictEffect, ConflictResolutionResult } from "../../../chrono/Conflict.js";
import { dateConverter, model_field } from '../../../chrono/ModelFieldAtom.js';
import { DateInterval, EMPTY_INTERVAL, intersectIntervals } from '../../../scheduling/DateInterval.js';
import { Direction } from '../../../scheduling/Types.js';
import { isDateFinite, MAX_DATE, MIN_DATE } from "../../../util/Constants.js";
import { HasSubEventsMixin } from "../scheduler_basic/HasSubEventsMixin.js";
export const calculateEffectiveStartDateConstraintInterval = function* (event, startDateIntervalIntersection, endDateIntervalIntersection, duration) {
    if (endDateIntervalIntersection.isIntervalEmpty())
        return EMPTY_INTERVAL;
    const startDate = endDateIntervalIntersection.startDateIsFinite()
        ?
            yield* event.calculateProjectedXDateWithDuration(endDateIntervalIntersection.startDate, false, duration)
        :
            null;
    const endDate = endDateIntervalIntersection.endDateIsFinite()
        ?
            yield* event.calculateProjectedXDateWithDuration(endDateIntervalIntersection.endDate, false, duration)
        :
            null;
    return intersectIntervals([startDateIntervalIntersection, DateInterval.new({ startDate, endDate })]);
};
export const calculateEffectiveEndDateConstraintInterval = function* (event, startDateIntervalIntersection, endDateIntervalIntersection, duration) {
    if (startDateIntervalIntersection.isIntervalEmpty())
        return EMPTY_INTERVAL;
    const startDate = startDateIntervalIntersection.startDateIsFinite()
        ?
            yield* event.calculateProjectedXDateWithDuration(startDateIntervalIntersection.startDate, true, duration)
        :
            null;
    const endDate = startDateIntervalIntersection.endDateIsFinite()
        ?
            yield* event.calculateProjectedXDateWithDuration(startDateIntervalIntersection.endDate, true, duration)
        :
            null;
    return intersectIntervals([endDateIntervalIntersection, DateInterval.new({ startDate, endDate })]);
};
export const EarlyLateLazyness = true;
export class ConstrainedEarlyEventMixin extends Mixin([HasSubEventsMixin], (base) => {
    const superProto = base.prototype;
    class ConstrainedEarlyEventMixin extends base {
        *maybeSkipNonWorkingTime(date, isForward = true) {
            let duration = yield* this.calculateEffectiveDuration();
            return date && duration > 0 ? yield* this.skipNonWorkingTime(date, isForward) : date;
        }
        *calculateEffectiveConstraintInterval(isStartDate, startDateConstraintIntervals, endDateConstraintIntervals) {
            const effectiveDurationToUse = yield* this.calculateEffectiveDuration();
            if (effectiveDurationToUse == null) {
                return null;
            }
            const calculateIntervalFn = (isStartDate ? calculateEffectiveStartDateConstraintInterval : calculateEffectiveEndDateConstraintInterval);
            const effectiveInterval = yield* calculateIntervalFn(this, intersectIntervals(startDateConstraintIntervals), intersectIntervals(endDateConstraintIntervals), effectiveDurationToUse);
            return effectiveInterval;
        }
        *calculateStartDateConstraintIntervals() {
            return [];
        }
        *calculateEndDateConstraintIntervals() {
            return [];
        }
        *calculateEarlyStartDateConstraintIntervals() {
            return [];
        }
        *calculateEarlyEndDateConstraintIntervals() {
            return [];
        }
        *calculateEarlyEffectiveStartDateInterval() {
            const startDateConstraintIntervals = yield this.$.earlyStartDateConstraintIntervals;
            const endDateConstraintIntervals = yield this.$.earlyEndDateConstraintIntervals;
            return yield* this.calculateEffectiveConstraintInterval(true, startDateConstraintIntervals.concat(yield this.$.startDateConstraintIntervals), endDateConstraintIntervals.concat(yield this.$.endDateConstraintIntervals));
        }
        *calculateEarlyEffectiveEndDateInterval() {
            const startDateConstraintIntervals = yield this.$.earlyStartDateConstraintIntervals;
            const endDateConstraintIntervals = yield this.$.earlyEndDateConstraintIntervals;
            return yield* this.calculateEffectiveConstraintInterval(false, startDateConstraintIntervals.concat(yield this.$.startDateConstraintIntervals), endDateConstraintIntervals.concat(yield this.$.endDateConstraintIntervals));
        }
        *calculateEarlyStartDateRaw() {
            if (yield* this.hasSubEvents()) {
                let result = MAX_DATE;
                const subEventsIterator = yield* this.subEventsIterable();
                for (let childEvent of subEventsIterator) {
                    const childDate = yield childEvent.$.earlyStartDate;
                    if (childDate && childDate < result)
                        result = childDate;
                }
                return result.getTime() - MAX_DATE.getTime() ? result : null;
            }
            if (yield this.$.manuallyScheduled) {
                return yield this.$.startDate;
            }
            if (!(yield* this.isConstrainedEarly())) {
                return yield this.$.startDate;
            }
            const effectiveInterval = yield this.$.earlyEffectiveStartDateInterval;
            if (effectiveInterval === null) {
                return null;
            }
            else if (effectiveInterval.isIntervalEmpty()) {
                const conflict = ConflictEffect.new();
                if ((yield conflict) === ConflictResolutionResult.Cancel) {
                    yield Reject(conflict);
                }
                else {
                    return null;
                }
            }
            return isDateFinite(effectiveInterval.startDate) ? effectiveInterval.startDate : null;
        }
        *calculateEarlyStartDate() {
            const date = yield this.$.earlyStartDateRaw;
            return yield* this.maybeSkipNonWorkingTime(date, true);
        }
        *calculateEarlyEndDateRaw() {
            if (yield* this.hasSubEvents()) {
                let result = MIN_DATE;
                const subEventsIterator = yield* this.subEventsIterable();
                for (let childEvent of subEventsIterator) {
                    const childDate = yield childEvent.$.earlyEndDate;
                    if (childDate && childDate > result)
                        result = childDate;
                }
                return result.getTime() - MIN_DATE.getTime() ? result : null;
            }
            if (yield this.$.manuallyScheduled) {
                return yield this.$.endDate;
            }
            if (!(yield* this.isConstrainedEarly())) {
                return yield this.$.endDate;
            }
            const effectiveInterval = yield this.$.earlyEffectiveEndDateInterval;
            if (effectiveInterval === null) {
                return null;
            }
            else if (effectiveInterval.isIntervalEmpty()) {
                const conflict = ConflictEffect.new();
                if ((yield conflict) === ConflictResolutionResult.Cancel) {
                    yield Reject(conflict);
                }
                else {
                    return null;
                }
            }
            return isDateFinite(effectiveInterval.startDate) ? effectiveInterval.startDate : null;
        }
        *calculateEarlyEndDate() {
            const date = yield this.$.earlyEndDateRaw;
            return yield* this.maybeSkipNonWorkingTime(date, false);
        }
        *isConstrainedEarly() {
            const startDateIntervals = yield this.$.startDateConstraintIntervals;
            const endDateIntervals = yield this.$.endDateConstraintIntervals;
            const earlyStartDateConstraintIntervals = yield this.$.earlyStartDateConstraintIntervals;
            const earlyEndDateConstraintIntervals = yield this.$.earlyEndDateConstraintIntervals;
            return Boolean((startDateIntervals === null || startDateIntervals === void 0 ? void 0 : startDateIntervals.length) || (endDateIntervals === null || endDateIntervals === void 0 ? void 0 : endDateIntervals.length) || (earlyStartDateConstraintIntervals === null || earlyStartDateConstraintIntervals === void 0 ? void 0 : earlyStartDateConstraintIntervals.length) || (earlyEndDateConstraintIntervals === null || earlyEndDateConstraintIntervals === void 0 ? void 0 : earlyEndDateConstraintIntervals.length));
        }
        *calculateStartDatePure() {
            const direction = yield this.$.direction;
            if (direction === Direction.Forward) {
                if (!(yield* this.isConstrainedEarly()) || (yield this.$.manuallyScheduled) || (yield* this.hasSubEvents())) {
                    return yield* superProto.calculateStartDatePure.call(this);
                }
                return (yield this.$.earlyStartDate) || (yield* superProto.calculateStartDatePure.call(this));
            }
            else {
                return yield* superProto.calculateStartDatePure.call(this);
            }
        }
        *calculateStartDateProposed() {
            const direction = yield this.$.direction;
            switch (direction) {
                case Direction.Forward:
                    if (!(yield* this.isConstrainedEarly()) || (yield this.$.manuallyScheduled) || (yield* this.hasSubEvents())) {
                        return yield* superProto.calculateStartDateProposed.call(this);
                    }
                    const autoStartDate = yield this.$.earlyStartDate;
                    if (autoStartDate) {
                        if (isDateFinite(autoStartDate))
                            return autoStartDate;
                        const baseSchedulingStartDate = yield* superProto.calculateStartDateProposed.call(this);
                        const earlyEffectiveStartDateInterval = yield this.$.earlyEffectiveStartDateInterval;
                        if (earlyEffectiveStartDateInterval.containsDate(baseSchedulingStartDate))
                            return baseSchedulingStartDate;
                        return isDateFinite(earlyEffectiveStartDateInterval.endDate) ? earlyEffectiveStartDateInterval.endDate : baseSchedulingStartDate;
                    }
                    else {
                        return yield* superProto.calculateStartDateProposed.call(this);
                    }
                default:
                    return yield* superProto.calculateStartDateProposed.call(this);
            }
        }
        *calculateEndDatePure() {
            const direction = yield this.$.direction;
            if (direction === Direction.Forward) {
                if (!(yield* this.isConstrainedEarly()) || (yield this.$.manuallyScheduled) || (yield* this.hasSubEvents())) {
                    return yield* superProto.calculateEndDatePure.call(this);
                }
                return (yield this.$.earlyEndDate) || (yield* superProto.calculateEndDatePure.call(this));
            }
            else {
                return yield* superProto.calculateEndDatePure.call(this);
            }
        }
        *calculateEndDateProposed() {
            const direction = yield this.$.direction;
            switch (direction) {
                case Direction.Forward:
                    if (!(yield* this.isConstrainedEarly()) || (yield this.$.manuallyScheduled) || (yield* this.hasSubEvents())) {
                        return yield* superProto.calculateEndDateProposed.call(this);
                    }
                    const autoEndDate = yield this.$.earlyEndDate;
                    if (autoEndDate) {
                        if (isDateFinite(autoEndDate))
                            return autoEndDate;
                        const baseSchedulingEndDate = yield* superProto.calculateEndDateProposed.call(this);
                        const earlyEffectiveEndDateInterval = yield this.$.earlyEffectiveEndDateInterval;
                        if (earlyEffectiveEndDateInterval.containsDate(baseSchedulingEndDate))
                            return baseSchedulingEndDate;
                        return isDateFinite(earlyEffectiveEndDateInterval.endDate) ? earlyEffectiveEndDateInterval.endDate : baseSchedulingEndDate;
                    }
                    else {
                        return yield* superProto.calculateEndDateProposed.call(this);
                    }
                default:
                    return yield* superProto.calculateEndDateProposed.call(this);
            }
        }
        *calculateDirection() {
            const project = this.getProject();
            return yield project.$.direction;
        }
    }
    __decorate([
        field({ lazy: EarlyLateLazyness })
    ], ConstrainedEarlyEventMixin.prototype, "earlyStartDateRaw", void 0);
    __decorate([
        model_field({ type: 'date', persist: false }, { lazy: EarlyLateLazyness, converter: dateConverter, persistent: false })
    ], ConstrainedEarlyEventMixin.prototype, "earlyStartDate", void 0);
    __decorate([
        field({ lazy: EarlyLateLazyness })
    ], ConstrainedEarlyEventMixin.prototype, "earlyEndDateRaw", void 0);
    __decorate([
        model_field({ type: 'date', persist: false }, { lazy: EarlyLateLazyness, converter: dateConverter, persistent: false })
    ], ConstrainedEarlyEventMixin.prototype, "earlyEndDate", void 0);
    __decorate([
        field()
    ], ConstrainedEarlyEventMixin.prototype, "startDateConstraintIntervals", void 0);
    __decorate([
        field()
    ], ConstrainedEarlyEventMixin.prototype, "endDateConstraintIntervals", void 0);
    __decorate([
        field({ lazy: EarlyLateLazyness })
    ], ConstrainedEarlyEventMixin.prototype, "earlyStartDateConstraintIntervals", void 0);
    __decorate([
        field({ lazy: EarlyLateLazyness })
    ], ConstrainedEarlyEventMixin.prototype, "earlyEndDateConstraintIntervals", void 0);
    __decorate([
        field()
    ], ConstrainedEarlyEventMixin.prototype, "earlyEffectiveStartDateInterval", void 0);
    __decorate([
        field()
    ], ConstrainedEarlyEventMixin.prototype, "earlyEffectiveEndDateInterval", void 0);
    __decorate([
        calculate('startDateConstraintIntervals')
    ], ConstrainedEarlyEventMixin.prototype, "calculateStartDateConstraintIntervals", null);
    __decorate([
        calculate('endDateConstraintIntervals')
    ], ConstrainedEarlyEventMixin.prototype, "calculateEndDateConstraintIntervals", null);
    __decorate([
        calculate('earlyStartDateConstraintIntervals')
    ], ConstrainedEarlyEventMixin.prototype, "calculateEarlyStartDateConstraintIntervals", null);
    __decorate([
        calculate('earlyEndDateConstraintIntervals')
    ], ConstrainedEarlyEventMixin.prototype, "calculateEarlyEndDateConstraintIntervals", null);
    __decorate([
        calculate('earlyEffectiveStartDateInterval')
    ], ConstrainedEarlyEventMixin.prototype, "calculateEarlyEffectiveStartDateInterval", null);
    __decorate([
        calculate('earlyEffectiveEndDateInterval')
    ], ConstrainedEarlyEventMixin.prototype, "calculateEarlyEffectiveEndDateInterval", null);
    __decorate([
        calculate('earlyStartDateRaw')
    ], ConstrainedEarlyEventMixin.prototype, "calculateEarlyStartDateRaw", null);
    __decorate([
        calculate('earlyStartDate')
    ], ConstrainedEarlyEventMixin.prototype, "calculateEarlyStartDate", null);
    __decorate([
        calculate('earlyEndDateRaw')
    ], ConstrainedEarlyEventMixin.prototype, "calculateEarlyEndDateRaw", null);
    __decorate([
        calculate('earlyEndDate')
    ], ConstrainedEarlyEventMixin.prototype, "calculateEarlyEndDate", null);
    __decorate([
        calculate('direction')
    ], ConstrainedEarlyEventMixin.prototype, "calculateDirection", null);
    return ConstrainedEarlyEventMixin;
}) {
}
