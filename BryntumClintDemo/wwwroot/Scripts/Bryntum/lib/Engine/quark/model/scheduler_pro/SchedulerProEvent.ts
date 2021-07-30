import { AnyConstructor, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js"
import { SchedulerBasicEvent } from "../scheduler_basic/SchedulerBasicEvent.js"
import { ConstrainedEarlyEventMixin } from "./ConstrainedEarlyEventMixin.js"
import { HasDateConstraintMixin } from "./HasDateConstraintMixin.js"
import { HasPercentDoneMixin } from "./HasPercentDoneMixin.js"
import { ScheduledByDependenciesEarlyEventMixin } from "./ScheduledByDependenciesEarlyEventMixin.js"
import { SchedulerProHasAssignmentsMixin } from "./SchedulerProHasAssignmentsMixin.js"


/**
 * This is an event class, [[SchedulerProProjectMixin]] is working with.
 * It is constructed as [[SchedulerBasicEvent]], enhanced with extra functionality.
 */
export class SchedulerProEvent extends Mixin(
    [
        SchedulerBasicEvent,
        HasDateConstraintMixin,
        HasPercentDoneMixin,
        SchedulerProHasAssignmentsMixin,
        ConstrainedEarlyEventMixin,
        ScheduledByDependenciesEarlyEventMixin
    ],
    (base : AnyConstructor<
        SchedulerBasicEvent
        & HasDateConstraintMixin
        & HasPercentDoneMixin
        & SchedulerProHasAssignmentsMixin
        & ConstrainedEarlyEventMixin
        & ScheduledByDependenciesEarlyEventMixin
        ,
        typeof SchedulerBasicEvent
        & typeof HasDateConstraintMixin
        & typeof HasPercentDoneMixin
        & typeof SchedulerProHasAssignmentsMixin
        & typeof ConstrainedEarlyEventMixin
        & typeof ScheduledByDependenciesEarlyEventMixin
    >) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class SchedulerProEvent extends base {
        // this seems to cause compilation error in incremental mode (IDE)
        // regular compilation does not produce errors
        // project         : SchedulerProProjectMixin
    }

    return SchedulerProEvent
}){}
