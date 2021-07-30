import { Reject } from "../../../../ChronoGraph/chrono/Effect.js"
import { AnyConstructor, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js"
import { CalculationIterator } from "../../../../ChronoGraph/primitives/Calculation.js"
import { calculate, field } from "../../../../ChronoGraph/replica/Entity.js"
import { CalendarIteratorResult } from "../../../calendar/CalendarCache.js"
import { CalendarCacheIntervalMultiple } from "../../../calendar/CalendarCacheIntervalMultiple.js"
import { CalendarCacheMultiple } from "../../../calendar/CalendarCacheMultiple.js"
import { Duration, TimeUnit } from "../../../scheduling/Types.js"
import { SchedulerProAssignmentMixin } from "./SchedulerProAssignmentMixin.js"
import { BaseCalendarMixin } from "../scheduler_basic/BaseCalendarMixin.js"
import { BaseResourceMixin } from "../scheduler_basic/BaseResourceMixin.js"
import { BaseHasAssignmentsMixin } from "../scheduler_basic/BaseHasAssignmentsMixin.js"
import { CommitResult } from "../../../../ChronoGraph/chrono/Graph.js"

//---------------------------------------------------------------------------------------------------------------------
/**
 * This mixins enhances the purely visual [[BaseHasAssignmentsMixin]] with scheduling according
 * to the calendars of the assigned resources.
 *
 * A time interval will be "counted" into the event duration, only if at least one assigned
 * resource has that interval as working time, and the event's own calendar also has that interval
 * as working. Otherwise the time is skipped and not counted into event's duration.
 */
export class SchedulerProHasAssignmentsMixin extends Mixin(
    [ BaseHasAssignmentsMixin ],
    (base : AnyConstructor<BaseHasAssignmentsMixin, typeof BaseHasAssignmentsMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class SchedulerProHasAssignmentsMixin extends base {

        @field()
        effectiveCalendarsCombination       : CalendarCacheMultiple

        @field()
        assignmentsByCalendar               : Map<BaseCalendarMixin, SchedulerProAssignmentMixin[]>


        /**
         * A method which assigns a resource to the current event
         */
        async assign (resource : InstanceType<this[ 'project' ][ 'resourceModelClass' ]>, units : number = 100) : Promise<CommitResult> {
            //<debug>
            // Preconditions:
            if (this.getAssignmentFor(resource)) throw new Error('Resource can\'t be assigned twice to the same task')
            //</debug>

            const assignmentCls = this.getProject().assignmentStore.modelClass as any

            this.addAssignment(new assignmentCls({
                event           : this,
                resource        : resource,
                units           : units
            }))

            return this.commitAsync()
        }


        * forEachAvailabilityInterval (
            options     : {
                startDate?                          : Date,
                endDate?                            : Date,
                isForward?                          : boolean,
                ignoreResourceCalendars?            : boolean
            },
            func        : (
                startDate                           : Date,
                endDate                             : Date,
                calendarCacheIntervalMultiple       : CalendarCacheIntervalMultiple
            ) => false | void
        ) : CalculationIterator<CalendarIteratorResult>
        {
            const calendar : BaseCalendarMixin                              = yield this.$.effectiveCalendar
            const assignmentsByCalendar : this[ 'assignmentsByCalendar' ]   = yield this.$.assignmentsByCalendar
            const effectiveCalendarsCombination                             = yield this.$.effectiveCalendarsCombination

            return effectiveCalendarsCombination.forEachAvailabilityInterval(
                options,
                (startDate : Date, endDate : Date, calendarCacheIntervalMultiple : CalendarCacheIntervalMultiple) => {
                    const calendarsStatus   = calendarCacheIntervalMultiple.getCalendarsWorkStatus()
                    const workCalendars     = calendarCacheIntervalMultiple.getCalendarsWorking()

                    if (
                        calendarsStatus.get(calendar)
                        &&
                        (options.ignoreResourceCalendars || workCalendars.some((calendar : BaseCalendarMixin) => assignmentsByCalendar.has(calendar)))
                    ) {
                        return func(startDate, endDate, calendarCacheIntervalMultiple)
                    }
                }
            )
        }


        // TODO seems this atom is used in single place only - can be merged there
        @calculate('effectiveCalendarsCombination')
        * calculateEffectiveCalendarsCombination () : CalculationIterator<this[ 'effectiveCalendarsCombination' ]> {
            const assignmentsByCalendar : this[ 'assignmentsByCalendar' ]       = yield this.$.assignmentsByCalendar

            const calendars : BaseCalendarMixin[]    = [ ...assignmentsByCalendar.keys(), yield this.$.effectiveCalendar ]

            return this.getProject().combineCalendars(calendars)
        }


        @calculate('assignmentsByCalendar')
        * calculateAssignmentsByCalendar  () : CalculationIterator<this[ 'assignmentsByCalendar' ]> {
            const assignments : Set<SchedulerProAssignmentMixin>              = yield this.$.assigned

            const result : Map<BaseCalendarMixin, SchedulerProAssignmentMixin[]> = new Map()

            for (const assignment of assignments) {
                const resource : BaseResourceMixin              = yield assignment.$.resource

                if (resource) {
                    const resourceCalendar : BaseCalendarMixin  = yield resource.$.effectiveCalendar

                    let assignments                             = result.get(resourceCalendar)

                    if (!assignments) {
                        assignments                             = []

                        result.set(resourceCalendar, assignments)
                    }

                    assignments.push(assignment)
                }
            }

            return result
        }


        * getBaseOptionsForDurationCalculations () : CalculationIterator<{ ignoreResourceCalendars : boolean }> {
            return { ignoreResourceCalendars : false }
        }


        * skipNonWorkingTime (date : Date, isForward : boolean = true) : CalculationIterator<Date> {
            if (!date) return null

            const assignmentsByCalendar : this[ 'assignmentsByCalendar' ]   = yield this.$.assignmentsByCalendar

            if (assignmentsByCalendar.size > 0) {
                const options   = Object.assign(
                    yield* this.getBaseOptionsForDurationCalculations(),
                    isForward ? { startDate : date, isForward } : { endDate : date, isForward }
                )

                let workingDate : Date

                const skipRes = yield* this.forEachAvailabilityInterval(
                    options,
                    (startDate : Date, endDate : Date, calendarCacheIntervalMultiple : CalendarCacheIntervalMultiple) => {
                        workingDate         = isForward ? startDate : endDate

                        return false
                    }
                )

                if (skipRes === CalendarIteratorResult.MaxRangeReached || skipRes === CalendarIteratorResult.FullRangeIterated) {
                    yield Reject("Empty calendar")
                }

                return new Date(workingDate)
            } else {
                return yield* superProto.skipNonWorkingTime.call(this, date, isForward)
            }
        }


        * calculateProjectedDuration (startDate : Date, endDate : Date, durationUnit? : TimeUnit) : CalculationIterator<Duration> {
            if (!startDate || !endDate) {
                return null
            }

            const assignmentsByCalendar : this[ 'assignmentsByCalendar' ]   = yield this.$.assignmentsByCalendar

            if (assignmentsByCalendar.size > 0) {
                const options   = Object.assign(
                    yield* this.getBaseOptionsForDurationCalculations(),
                    { startDate, endDate, isForward : true }
                )

                let result : Duration = 0

                yield* this.forEachAvailabilityInterval(
                    options,
                    (startDate : Date, endDate : Date) => {
                        result += endDate.getTime() - startDate.getTime()
                    }
                )

                if (!durationUnit) durationUnit = yield this.$.durationUnit

                return yield* this.getProject().$convertDuration(result, TimeUnit.Millisecond, durationUnit)
            } else {
                return yield* superProto.calculateProjectedDuration.call(this, startDate, endDate, durationUnit)
            }
        }


        * calculateProjectedXDateWithDuration (baseDate : Date, isForward : boolean = true, duration : Duration) : CalculationIterator<Date> {
            if (duration == null || isNaN(duration) || baseDate == null) return null

            if (duration == 0) return baseDate

            const durationUnit : TimeUnit           = yield this.$.durationUnit
            const durationMS : number               = yield* this.getProject().$convertDuration(duration, durationUnit, TimeUnit.Millisecond)

            let resultN : number                    = baseDate.getTime()
            let leftDuration : number               = durationMS

            const calendar : BaseCalendarMixin          = yield this.$.effectiveCalendar

            const assignmentsByCalendar : this[ 'assignmentsByCalendar' ]   = yield this.$.assignmentsByCalendar

            if (assignmentsByCalendar.size > 0) {
                const options   = Object.assign(
                    yield* this.getBaseOptionsForDurationCalculations(),
                    isForward ? { startDate : baseDate, isForward } : { endDate : baseDate, isForward }
                )

                yield* this.forEachAvailabilityInterval(
                    options,

                    (intervalStart : Date, intervalEnd : Date, calendarCacheIntervalMultiple : CalendarCacheIntervalMultiple) => {
                        const intervalStartN : number   = intervalStart.getTime(),
                            intervalEndN : number       = intervalEnd.getTime(),
                            intervalDuration : Duration = intervalEndN - intervalStartN

                        if (intervalDuration >= leftDuration) {
                            resultN                     = isForward ? intervalStartN + leftDuration : intervalEndN - leftDuration

                            return false
                        } else {
                            const dstDiff               = intervalStart.getTimezoneOffset() - intervalEnd.getTimezoneOffset()

                            leftDuration                -= intervalDuration + dstDiff * 60 * 1000
                        }
                    }
                )

                return new Date(resultN)
            }
            else {
                return calendar.accumulateWorkingTime(baseDate, durationMS, isForward).finalDate
            }
        }
    }

    return SchedulerProHasAssignmentsMixin
}){}
