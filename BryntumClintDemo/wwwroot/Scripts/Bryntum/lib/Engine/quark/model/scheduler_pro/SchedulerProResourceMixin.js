var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Base, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js";
import { calculate, Entity, field } from "../../../../ChronoGraph/replica/Entity.js";
import { CalendarIntervalMixin } from "../../../calendar/CalendarIntervalMixin.js";
import { CalendarIntervalStore } from "../../../calendar/CalendarIntervalStore.js";
import { model_field } from "../../../chrono/ModelFieldAtom.js";
import { BaseCalendarMixin } from "../scheduler_basic/BaseCalendarMixin.js";
import { BaseResourceMixin } from "../scheduler_basic/BaseResourceMixin.js";
export class ResourceAllocationEventRangeCalendarIntervalMixin extends CalendarIntervalMixin {
    static get fields() {
        return [
            { name: 'isWorking', type: 'boolean', defaultValue: true }
        ];
    }
}
export class ResourceAllocationEventRangeCalendarIntervalStore extends CalendarIntervalStore {
    static get defaultConfig() {
        return {
            modelClass: ResourceAllocationEventRangeCalendarIntervalMixin
        };
    }
}
export class ResourceAllocationEventRangeCalendar extends BaseCalendarMixin {
    get intervalStoreClass() {
        return ResourceAllocationEventRangeCalendarIntervalStore;
    }
}
__decorate([
    model_field({ type: 'boolean', defaultValue: false })
], ResourceAllocationEventRangeCalendar.prototype, "unspecifiedTimeIsWorking", void 0);
export class ResourceAllocationInterval extends Base {
    constructor() {
        super(...arguments);
        this.assignments = null;
        this.effort = 0;
        this.maxEffort = 0;
        this.units = 0;
        this.isOverallocated = false;
        this.isUnderallocated = false;
    }
}
export class ResourceAllocationInfo extends Entity.mix(Base) {
    *calculateAllocation() {
        const result = [], ticksCalendar = yield this.ticks, resource = yield this.$.resource, assignments = yield resource.$.assigned, assignmentsByCalendar = new Map(), eventRanges = [];
        for (const assignment of assignments) {
            const event = yield assignment.$.event;
            yield assignment.$.units;
            if (event) {
                const startDate = yield event.$.startDate, endDate = yield event.$.endDate;
                eventRanges.push({ startDate, endDate, assignment });
                const eventCalendar = yield event.$.effectiveCalendar;
                let assignments = assignmentsByCalendar.get(eventCalendar);
                if (!assignments) {
                    assignments = [];
                    assignmentsByCalendar.set(eventCalendar, assignments);
                }
                assignments.push(assignment);
            }
        }
        const eventRangesCalendar = new ResourceAllocationEventRangeCalendar({ intervals: eventRanges });
        const calendars = [ticksCalendar, eventRangesCalendar, ...assignmentsByCalendar.keys()];
        const ticksData = new Map();
        ticksCalendar.intervalStore.forEach(tick => {
            const tickData = ResourceAllocationInterval.new({ tick, resource });
            ticksData.set(tick, tickData);
            result.push(tickData);
        });
        let weightedUnitsSum, weightsSum;
        yield* resource.forEachAvailabilityInterval({
            startDate: result[0].tick.startDate,
            endDate: result[result.length - 1].tick.endDate,
            calendars
        }, (intervalStartDate, intervalEndDate, intervalData) => {
            const isWorkingCalendar = intervalData.getCalendarsWorkStatus();
            if (isWorkingCalendar.get(ticksCalendar)) {
                const tick = intervalData.intervalsByCalendar.get(ticksCalendar)[0], intervalDuration = intervalEndDate.getTime() - intervalStartDate.getTime(), tickData = ticksData.get(tick), tickAssignments = tickData.assignments || new Set();
                if (!tickData.assignments) {
                    weightedUnitsSum = 0;
                    weightsSum = 0;
                }
                let units = 0, duration;
                intervalData.intervalsByCalendar.get(eventRangesCalendar).forEach((interval) => {
                    const assignment = interval.assignment;
                    if (assignment && isWorkingCalendar.get(assignment.event.effectiveCalendar)) {
                        const workingStartDate = Math.max(intervalStartDate.getTime(), assignment.event.startDate.getTime());
                        const workingEndDate = Math.min(intervalEndDate.getTime(), assignment.event.endDate.getTime());
                        duration = workingEndDate - workingStartDate;
                        tickData.effort += duration * assignment.units / 100;
                        units += assignment.units;
                        tickAssignments.add(assignment);
                    }
                });
                tickData.maxEffort += intervalDuration;
                if (units) {
                    if (duration) {
                        weightedUnitsSum += duration * units;
                        weightsSum += duration;
                        tickData.units = weightedUnitsSum / weightsSum;
                    }
                    else if (!weightedUnitsSum) {
                        tickData.units = units;
                    }
                }
                if (tickAssignments.size) {
                    tickData.assignments = tickAssignments;
                    tickData.isOverallocated = tickData.isOverallocated || units > 100;
                    tickData.isUnderallocated = tickData.isUnderallocated || units < 100;
                }
            }
        });
        return result;
    }
}
__decorate([
    field()
], ResourceAllocationInfo.prototype, "resource", void 0);
__decorate([
    field()
], ResourceAllocationInfo.prototype, "allocation", void 0);
__decorate([
    calculate('allocation')
], ResourceAllocationInfo.prototype, "calculateAllocation", null);
export class SchedulerProResourceMixin extends Mixin([BaseResourceMixin], (base) => {
    const superProto = base.prototype;
    class SchedulerProResourceMixin extends base {
        constructor() {
            super(...arguments);
            this.observers = new Set();
            this.entities = new Set();
        }
        leaveGraph(replica) {
            const { graph } = this;
            for (const entity of this.entities) {
                graph.removeEntity(entity);
            }
            for (const observer of this.observers) {
                graph.removeIdentifier(observer);
            }
            superProto.leaveGraph.call(this, replica);
        }
        *forEachAvailabilityInterval(options, func) {
            const calendar = yield this.$.effectiveCalendar;
            const effectiveCalendarsCombination = this.getProject().combineCalendars([calendar].concat(options.calendars || []));
            return effectiveCalendarsCombination.forEachAvailabilityInterval(options, (startDate, endDate, calendarCacheIntervalMultiple) => {
                const calendarsStatus = calendarCacheIntervalMultiple.getCalendarsWorkStatus();
                if (calendarsStatus.get(calendar)) {
                    return func(startDate, endDate, calendarCacheIntervalMultiple);
                }
            });
        }
    }
    return SchedulerProResourceMixin;
}) {
}
