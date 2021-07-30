import { Mixin } from "../../../../ChronoGraph/class/BetterMixin.js";
import { MAX_DATE, MIN_DATE } from "../../../util/Constants.js";
import { BaseEventMixin } from "./BaseEventMixin.js";
export class HasSubEventsMixin extends Mixin([BaseEventMixin], (base) => {
    const superProto = base.prototype;
    class HasSubEventsMixin extends base {
        *hasSubEvents() {
            throw new Error("Abstract method `hasSubEvents` has been called");
        }
        *subEventsIterable() {
            throw new Error("Abstract method `subEventsIterable` has been called");
        }
        *calculateStartDatePure() {
            const manuallyScheduled = yield this.$.manuallyScheduled;
            const hasSubEvents = yield* this.hasSubEvents();
            if (!manuallyScheduled && hasSubEvents) {
                return yield* this.calculateMinChildrenStartDate();
            }
            else {
                return yield* superProto.calculateStartDatePure.call(this);
            }
        }
        *calculateEndDatePure() {
            const manuallyScheduled = yield this.$.manuallyScheduled;
            const hasSubEvents = yield* this.hasSubEvents();
            if (!manuallyScheduled && hasSubEvents) {
                return yield* this.calculateMaxChildrenEndDate();
            }
            else {
                return yield* superProto.calculateEndDatePure.call(this);
            }
        }
        *calculateStartDateProposed() {
            const manuallyScheduled = yield this.$.manuallyScheduled;
            const hasSubEvents = yield* this.hasSubEvents();
            if (!manuallyScheduled && hasSubEvents) {
                return yield* this.calculateStartDatePure();
            }
            else {
                return yield* superProto.calculateStartDateProposed.call(this);
            }
        }
        *calculateEndDateProposed() {
            const manuallyScheduled = yield this.$.manuallyScheduled;
            const hasSubEvents = yield* this.hasSubEvents();
            if (!manuallyScheduled && hasSubEvents) {
                return yield* this.calculateEndDatePure();
            }
            else {
                return yield* superProto.calculateEndDateProposed.call(this);
            }
        }
        *calculateDurationProposed() {
            const manuallyScheduled = yield this.$.manuallyScheduled;
            const hasSubEvents = yield* this.hasSubEvents();
            if (!manuallyScheduled && hasSubEvents) {
                return yield* this.calculateDurationPure();
            }
            else {
                return yield* superProto.calculateDurationProposed.call(this);
            }
        }
        *calculateMinChildrenStartDate() {
            const subEvents = yield* this.subEventsIterable();
            const subStartDates = [];
            for (const subEvent of subEvents) {
                subStartDates.push(yield subEvent.$.startDate);
            }
            let timestamp = subStartDates.reduce((acc, subStartDate) => subStartDate ? Math.min(acc, subStartDate.getTime()) : acc, MAX_DATE.getTime());
            if (timestamp === MIN_DATE.getTime() || timestamp === MAX_DATE.getTime())
                return null;
            return new Date(timestamp);
        }
        *calculateMaxChildrenEndDate() {
            const subEvents = yield* this.subEventsIterable();
            const subEndDates = [];
            for (const subEvent of subEvents) {
                subEndDates.push(yield subEvent.$.endDate);
            }
            let timestamp = subEndDates.reduce((acc, subEndDate) => subEndDate ? Math.max(acc, subEndDate.getTime()) : acc, MIN_DATE.getTime());
            if (timestamp === MIN_DATE.getTime() || timestamp === MAX_DATE.getTime())
                return null;
            return new Date(timestamp);
        }
    }
    return HasSubEventsMixin;
}) {
}
