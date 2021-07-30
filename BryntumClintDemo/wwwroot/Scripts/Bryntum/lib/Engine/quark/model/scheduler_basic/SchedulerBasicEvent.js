import { Mixin } from '../../../../ChronoGraph/class/BetterMixin.js';
import { BaseEventMixin } from './BaseEventMixin.js';
import { BaseHasAssignmentsMixin } from "./BaseHasAssignmentsMixin.js";
import { HasDependenciesMixin } from './HasDependenciesMixin.js';
export class SchedulerBasicEvent extends Mixin([
    BaseEventMixin,
    BaseHasAssignmentsMixin,
    HasDependenciesMixin
], (base) => {
    const superProto = base.prototype;
    class SchedulerBasicEvent extends base {
    }
    return SchedulerBasicEvent;
}) {
}
