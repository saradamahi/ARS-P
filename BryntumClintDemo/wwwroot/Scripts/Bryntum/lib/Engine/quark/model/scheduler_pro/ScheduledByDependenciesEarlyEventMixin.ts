import { AnyConstructor, Mixin } from '../../../../ChronoGraph/class/BetterMixin.js'
import { CalculationIterator } from "../../../../ChronoGraph/primitives/Calculation.js"
import { calculate } from '../../../../ChronoGraph/replica/Entity.js'
import { isAtomicValue } from '../../../../ChronoGraph/util/Helpers.js'
import { DateInterval } from '../../../scheduling/DateInterval.js'
import { DependencyType, Duration, TimeUnit } from '../../../scheduling/Types.js'
import { BaseCalendarMixin } from '../scheduler_basic/BaseCalendarMixin.js'
import { HasDependenciesMixin } from "../scheduler_basic/HasDependenciesMixin.js"
import { ConstrainedEarlyEventMixin } from './ConstrainedEarlyEventMixin.js'
import { SchedulerProProjectMixin } from "./SchedulerProProjectMixin.js"


//---------------------------------------------------------------------------------------------------------------------
/**
 * This mixin adds support for scheduling event ASAP, by dependencies. All it does is
 * create the constraint interval for every incoming dependency. See [[ConstrainedEarlyEventMixin]] for
 * more details about constraint-based scheduling.
 *
 * The supported dependency types are listed in this enum: [[DependencyType]]
 */
export class ScheduledByDependenciesEarlyEventMixin extends Mixin(
    [ ConstrainedEarlyEventMixin, HasDependenciesMixin ],
    (base : AnyConstructor<ConstrainedEarlyEventMixin & HasDependenciesMixin, typeof ConstrainedEarlyEventMixin & typeof HasDependenciesMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class ScheduledByDependenciesEarlyEventMixin extends base {

        project             : SchedulerProProjectMixin


        * calculateEarlyStartDateConstraintIntervals () : CalculationIterator<DateInterval[]> {
            const intervals : DateInterval[]    = yield* superProto.calculateEarlyStartDateConstraintIntervals.call(this)

            const project : SchedulerProProjectMixin   = this.getProject()

            for (const dependency of (yield this.$.incomingDeps)) {
                const fromEvent : ScheduledByDependenciesEarlyEventMixin = yield dependency.$.fromEvent

                const isActive = yield dependency.$.active

                // ignore missing from events
                if (fromEvent == null || isAtomicValue(fromEvent) || !isActive) continue

                let interval : DateInterval

                switch (yield dependency.$.type) {
                    case DependencyType.EndToStart:
                        const fromEventEndDate : Date           = yield fromEvent.$.earlyEndDateRaw

                        if (fromEventEndDate) {
                            const lag : Duration                = yield dependency.$.lag
                            const lagUnit : TimeUnit            = yield dependency.$.lagUnit
                            const calendar : BaseCalendarMixin  = yield dependency.$.calendar

                            interval = DateInterval.new({
                                startDate   : calendar.calculateEndDate(
                                    fromEventEndDate,
                                    yield* project.$convertDuration(lag, lagUnit, TimeUnit.Millisecond)
                                ),
                                endDate     : null
                            })
                        }
                        break

                    case DependencyType.StartToStart:
                        const fromEventStartDate : Date         = yield fromEvent.$.earlyStartDateRaw

                        if (fromEventStartDate) {
                            const lag : Duration                = yield dependency.$.lag
                            const lagUnit : TimeUnit            = yield dependency.$.lagUnit
                            const calendar : BaseCalendarMixin  = yield dependency.$.calendar

                            interval = DateInterval.new({
                                startDate   : calendar.calculateEndDate(
                                    fromEventStartDate,
                                    yield* project.$convertDuration(lag, lagUnit, TimeUnit.Millisecond)
                                ),
                                endDate     : null
                            })
                        }
                        break
                }

                interval && intervals.unshift(interval)
            }

            return intervals
        }


        @calculate('earlyEndDateIntervals')
        * calculateEarlyEndDateConstraintIntervals () : CalculationIterator<DateInterval[]> {
            const intervals : DateInterval[]    = yield* superProto.calculateEarlyEndDateConstraintIntervals.call(this)

            const project : SchedulerProProjectMixin   = this.getProject()

            for (const dependency of (yield this.$.incomingDeps)) {
                const fromEvent : ScheduledByDependenciesEarlyEventMixin = yield dependency.$.fromEvent

                const isActive = yield dependency.$.active

                // ignore missing from events
                if (fromEvent == null || isAtomicValue(fromEvent) || !isActive) continue

                let interval : DateInterval

                switch (yield dependency.$.type) {
                    case DependencyType.EndToEnd:
                        const fromEventEndDate : Date = yield fromEvent.$.earlyEndDateRaw

                        if (fromEventEndDate) {
                            const lag : Duration                = yield dependency.$.lag
                            const lagUnit : TimeUnit            = yield dependency.$.lagUnit
                            const calendar : BaseCalendarMixin  = yield dependency.$.calendar

                            interval = DateInterval.new({
                                startDate   : calendar.calculateEndDate(
                                    fromEventEndDate,
                                    yield* project.$convertDuration(lag, lagUnit, TimeUnit.Millisecond)
                                ),
                                endDate     : null
                            })
                        }
                        break

                    case DependencyType.StartToEnd:
                        const fromEventStartDate : Date = yield fromEvent.$.earlyStartDateRaw

                        if (fromEventStartDate) {
                            const lag : Duration                = yield dependency.$.lag
                            const lagUnit : TimeUnit            = yield dependency.$.lagUnit
                            const calendar : BaseCalendarMixin  = yield dependency.$.calendar

                            interval = DateInterval.new({
                                startDate   : calendar.calculateEndDate(
                                    fromEventStartDate,
                                    yield* project.$convertDuration(lag, lagUnit, TimeUnit.Millisecond)
                                ),
                                endDate     : null
                            })
                        }
                        break
                }

                interval && intervals.unshift(interval)
            }

            return intervals
        }
    }

    return ScheduledByDependenciesEarlyEventMixin
}){}
