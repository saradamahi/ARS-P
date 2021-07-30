import { Reject } from "../../../../ChronoGraph/chrono/Effect.js"
import { AnyConstructor, Mixin } from '../../../../ChronoGraph/class/BetterMixin.js'
import { CalculationIterator } from '../../../../ChronoGraph/primitives/Calculation.js'
import { calculate, field } from '../../../../ChronoGraph/replica/Entity.js'
import { ConflictEffect, ConflictResolutionResult } from "../../../chrono/Conflict.js"
import { dateConverter, model_field } from '../../../chrono/ModelFieldAtom.js'
import { DateInterval, EMPTY_INTERVAL, intersectIntervals } from '../../../scheduling/DateInterval.js'
import { Direction, Duration } from '../../../scheduling/Types.js'
import { isDateFinite, MAX_DATE, MIN_DATE } from "../../../util/Constants.js"
import { BaseEventMixin } from "../scheduler_basic/BaseEventMixin.js"
import { HasSubEventsMixin } from "../scheduler_basic/HasSubEventsMixin.js"
import { SchedulerBasicProjectMixin } from "../scheduler_basic/SchedulerBasicProjectMixin.js"

//---------------------------------------------------------------------------------------------------------------------
export const calculateEffectiveStartDateConstraintInterval = function* (
    event                               : BaseEventMixin,
    startDateIntervalIntersection       : DateInterval,
    endDateIntervalIntersection         : DateInterval,
    duration                            : Duration
) : CalculationIterator<DateInterval>
{
    if (endDateIntervalIntersection.isIntervalEmpty()) return EMPTY_INTERVAL

    const startDate = endDateIntervalIntersection.startDateIsFinite()
        ?
            yield* event.calculateProjectedXDateWithDuration(endDateIntervalIntersection.startDate, false, duration)
        :
            null

    const endDate   = endDateIntervalIntersection.endDateIsFinite()
        ?
            yield* event.calculateProjectedXDateWithDuration(endDateIntervalIntersection.endDate, false, duration)
        :
            null

    return intersectIntervals([ startDateIntervalIntersection, DateInterval.new({ startDate, endDate }) ])
}

export const calculateEffectiveEndDateConstraintInterval = function* (
    event                           : BaseEventMixin,
    startDateIntervalIntersection   : DateInterval,
    endDateIntervalIntersection     : DateInterval,
    duration                        : Duration
) : CalculationIterator<DateInterval>
{
    if (startDateIntervalIntersection.isIntervalEmpty()) return EMPTY_INTERVAL

    const startDate = startDateIntervalIntersection.startDateIsFinite()
        ?
            yield* event.calculateProjectedXDateWithDuration(startDateIntervalIntersection.startDate, true, duration)
        :
            null

    const endDate   = startDateIntervalIntersection.endDateIsFinite()
        ?
            yield* event.calculateProjectedXDateWithDuration(startDateIntervalIntersection.endDate, true, duration)
        :
            null

    return intersectIntervals([ endDateIntervalIntersection, DateInterval.new({ startDate, endDate }) ])
}

export const EarlyLateLazyness = true

//---------------------------------------------------------------------------------------------------------------------
/**
 * This mixin provides the constraint-based scheduling. Event is scheduled according to the set of _constraints_
 * which can be applied to start date or end date.
 *
 * Scheduling by constraints for an event can be disabled by setting its [[manuallyScheduled]] flag to `true`, which will delegate to previous behavior.
 *
 * The constraint is represented with the [[DateInterval]] class, which indicates the "allowed" interval for the
 * point being constrained.
 *
 * Scheduling by constraints algorithm
 * ---------------------------------
 *
 * Constraints for start date are accumulated in the [[earlyStartDateConstraintIntervals]] and [[startDateConstraintIntervals]] fields.
 * Constraints for end date are accumulated in the [[earlyEndDateConstraintIntervals]] and [[endDateConstraintIntervals]] fields.
 *
 * This mixin does not define where the constraints for the event comes from. The constraints are calculated in the field
 * calculation methods, (like [[calculateEarlyStartDateConstraintIntervals]]) which just return empty arrays. Some other mixins
 * may override those methods and can generate actual constraints (the [[ScheduledByDependenciesEarlyEventMixin]] is an example).

 * The "early" fields contains the constraints which are related to scheduling event in the as-soon-as-possible manner.
 * The fields w/o "early" prefix contains the constraints which do not related to the ASAP scheduling.
 *
 * "Early" and "normal" constraints for every date are combined, then intersected, which gives "combined" constraining interval.
 *
 * So at this point we have a "combined" constraining interval for start date and for end date.
 *
 * Then, the interval for start date is shifted on the event duration to the right and this gives an additional constraint for the
 * end date. The similar operation is done with the interval for the end date.
 *
 * After intersection with those additional intervals we receive the final constraining interval for both dates. Since we
 * are using the ASAP scheduling, we just pick the earliest possible date.
 *
 * If any of intervals is empty then we consider it as scheduling conflict, and [[EngineReplica.reject|reject]] the transaction.
 *
 */
export class ConstrainedEarlyEventMixin extends Mixin(
    [ HasSubEventsMixin ],
    (base : AnyConstructor<HasSubEventsMixin, typeof HasSubEventsMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class ConstrainedEarlyEventMixin extends base {
        project     : SchedulerBasicProjectMixin

        //--------------------------
        @field({ lazy : EarlyLateLazyness })
        earlyStartDateRaw : Date

        @model_field(
            { type : 'date', persist : false },
            { lazy : EarlyLateLazyness, converter : dateConverter, persistent : false }
        )
        earlyStartDate : Date


        //--------------------------
        @field({ lazy : EarlyLateLazyness })
        earlyEndDateRaw : Date

        @model_field(
            { type : 'date', persist : false },
            { lazy : EarlyLateLazyness, converter : dateConverter, persistent : false }
        )
        earlyEndDate : Date


        //--------------------------
        /**
         * Field to accumulate the "generic" constraints for start date (which are not related to ASAP scheduling).
         * It is calculated with [[calculateStartDateConstraintIntervals]].
         */
        @field()
        startDateConstraintIntervals    : DateInterval[]

        /**
         * Field to accumulate the "generic" constraints for end date (which are not related to ASAP scheduling).
         * It is calculated with [[calculateEndDateConstraintIntervals]].
         */
        @field()
        endDateConstraintIntervals      : DateInterval[]

        //--------------------------
        /**
         * An array of intervals, constraining the start date (as point in time) of this event
         * in case the event is scheduled ASAP (as soon as possible). It is calculated with [[calculateEarlyStartDateConstraintIntervals]]
         */
        @field({ lazy : EarlyLateLazyness })
        earlyStartDateConstraintIntervals : DateInterval[]

        /**
         * An array of intervals, constraining the end date (as point in time) of this event
         * in case the event is scheduled ASAP (as soon as possible). It is calculated with [[calculateEarlyEndDateConstraintIntervals]]
         */
        @field({ lazy : EarlyLateLazyness })
        earlyEndDateConstraintIntervals : DateInterval[]

        //--------------------------
        @field()
        earlyEffectiveStartDateInterval : DateInterval

        @field()
        earlyEffectiveEndDateInterval   : DateInterval

        // * validateProposedStartDate (startDate : Date) : CalculationIterator<void> {
        //     // if we have a proposed date let's validate it against registered constraining intervals
        //     if (startDate) {
        //         // need to adjust the proposed date according to the calendar, to avoid unnecessary conflicts
        //         const adjustedProposedDate : Date = yield* this.skipNonWorkingTime(startDate, true)
        //
        //         const startDateIntervals : DateInterval[] = []//yield this.$.combinedStartDateConstraintIntervals
        //
        //         let acc : DateInterval      = DateInterval.new()
        //
        //         for (let interval of startDateIntervals) {
        //             acc                     = acc.intersect(interval)
        //
        //             if (!acc.containsDate(adjustedProposedDate)) {
        //                 // TODO: trigger conflict here
        //                 // yield ProposedDateOutsideOfConstraint.new({
        //                 //     proposedDate        : adjustedProposedDate,
        //                 //     conflictingInterval : interval
        //                 // })
        //             }
        //         }
        //     }
        // }
        //
        //
        // * validateProposedEndDate (endDate : Date) : CalculationIterator<void> {
        //     if (endDate) {
        //         const adjustedProposedDate : Date = yield* this.skipNonWorkingTime(endDate, false)
        //
        //         const endDateIntervals : DateInterval[] = []//yield this.$.combinedEndDateConstraintIntervals
        //
        //         let acc : DateInterval      = DateInterval.new()
        //
        //         for (let interval of endDateIntervals) {
        //             acc                     = acc.intersect(interval)
        //
        //             if (!acc.containsDate(adjustedProposedDate)) {
        //                 // yield ProposedDateOutsideOfConstraint.new({
        //                 //     proposedDate        : adjustedProposedDate,
        //                 //     conflictingInterval : interval
        //                 // })
        //             }
        //         }
        //     }
        // }


        // Skips non-working time if it's needed to the event
        * maybeSkipNonWorkingTime (date : Date, isForward : boolean = true) : CalculationIterator<Date> {
            let duration : Duration     = yield* this.calculateEffectiveDuration()

            return date && duration > 0 ? yield* this.skipNonWorkingTime(date, isForward) : date
        }


        * calculateEffectiveConstraintInterval (
            isStartDate : boolean, startDateConstraintIntervals : DateInterval[], endDateConstraintIntervals : DateInterval[]
        ) : CalculationIterator<DateInterval>
        {
            const effectiveDurationToUse : Duration = yield* this.calculateEffectiveDuration()

            if (effectiveDurationToUse == null) {
                return null
            }

            const calculateIntervalFn : Function    = (isStartDate ? calculateEffectiveStartDateConstraintInterval : calculateEffectiveEndDateConstraintInterval)

            const effectiveInterval : DateInterval  = yield* calculateIntervalFn(
                this,
                intersectIntervals(startDateConstraintIntervals),
                intersectIntervals(endDateConstraintIntervals),
                effectiveDurationToUse
            )

            return effectiveInterval
        }


        /**
         * Calculation method for the [[startDateConstraintIntervals]]. Returns empty array by default.
         * Override this method to return some extra constraints for the start date.
         */
        @calculate('startDateConstraintIntervals')
        * calculateStartDateConstraintIntervals () : CalculationIterator<this[ 'startDateConstraintIntervals' ]> {
            return []
        }


        /**
         * Calculation method for the [[endDateConstraintIntervals]]. Returns empty array by default.
         * Override this method to return some extra constraints for the end date.
         */
        @calculate('endDateConstraintIntervals')
        * calculateEndDateConstraintIntervals () : CalculationIterator<this[ 'endDateConstraintIntervals' ]> {
            return []
        }


        /**
         * Calculation method for the [[earlyStartDateConstraintIntervals]]. Returns empty array by default.
         * Override this method to return some extra constraints for the start date during the ASAP scheduling.
         */
        @calculate('earlyStartDateConstraintIntervals')
        * calculateEarlyStartDateConstraintIntervals () : CalculationIterator<this[ 'earlyStartDateConstraintIntervals' ]> {
            return []
        }


        /**
         * Calculation method for the [[earlyEndDateConstraintIntervals]]. Returns empty array by default.
         * Override this method to return some extra constraints for the end date during the ASAP scheduling.
         */
        @calculate('earlyEndDateConstraintIntervals')
        * calculateEarlyEndDateConstraintIntervals () : CalculationIterator<this[ 'earlyEndDateConstraintIntervals' ]> {
            return []
        }


        @calculate('earlyEffectiveStartDateInterval')
        * calculateEarlyEffectiveStartDateInterval () : CalculationIterator<DateInterval> {
            const startDateConstraintIntervals : DateInterval[] = yield this.$.earlyStartDateConstraintIntervals
            const endDateConstraintIntervals : DateInterval[]   = yield this.$.earlyEndDateConstraintIntervals

            return yield* this.calculateEffectiveConstraintInterval(
                true,
                // need to use concat instead of directly mutating the `startDateConstraintIntervals` since that is
                // used as storage for `this.$.earlyStartDateConstraintIntervals`
                startDateConstraintIntervals.concat(yield this.$.startDateConstraintIntervals),
                endDateConstraintIntervals.concat(yield this.$.endDateConstraintIntervals),
            )
        }


        @calculate('earlyEffectiveEndDateInterval')
        * calculateEarlyEffectiveEndDateInterval () : CalculationIterator<DateInterval> {
            const startDateConstraintIntervals : DateInterval[] = yield this.$.earlyStartDateConstraintIntervals
            const endDateConstraintIntervals : DateInterval[]   = yield this.$.earlyEndDateConstraintIntervals

            return yield* this.calculateEffectiveConstraintInterval(
                false,
                // need to use concat instead of directly mutating the `startDateConstraintIntervals` since that is
                // used as storage for `this.$.earlyStartDateConstraintIntervals`
                startDateConstraintIntervals.concat(yield this.$.startDateConstraintIntervals),
                endDateConstraintIntervals.concat(yield this.$.endDateConstraintIntervals),
            )
        }


        @calculate('earlyStartDateRaw')
        * calculateEarlyStartDateRaw () : CalculationIterator<Date> {
            if (yield* this.hasSubEvents()) {
                let result = MAX_DATE

                const subEventsIterator : Iterable<ConstrainedEarlyEventMixin> = yield* this.subEventsIterable() as any

                for (let childEvent of subEventsIterator) {
                    const childDate : Date = yield childEvent.$.earlyStartDate

                    if (childDate && childDate < result) result = childDate
                }

                return result.getTime() - MAX_DATE.getTime() ? result : null
            }

            if (yield this.$.manuallyScheduled) {
                return yield this.$.startDate
            }

            if (!(yield* this.isConstrainedEarly())) {
                return yield this.$.startDate
            }

            const effectiveInterval = yield this.$.earlyEffectiveStartDateInterval

            if (effectiveInterval === null) {
                return null
            }
            else if (effectiveInterval.isIntervalEmpty()) {
                const conflict  = ConflictEffect.new()

                if ((yield conflict) === ConflictResolutionResult.Cancel) {
                    yield Reject(conflict)
                } else {
                    return null
                }
            }

            return isDateFinite(effectiveInterval.startDate) ? effectiveInterval.startDate : null
        }


        @calculate('earlyStartDate')
        * calculateEarlyStartDate () : CalculationIterator<Date> {
            const date : Date = yield this.$.earlyStartDateRaw

            return yield* this.maybeSkipNonWorkingTime(date, true)
        }


        @calculate('earlyEndDateRaw')
        * calculateEarlyEndDateRaw () : CalculationIterator<Date> {
            if (yield* this.hasSubEvents()) {
                let result : Date = MIN_DATE

                const subEventsIterator : Iterable<ConstrainedEarlyEventMixin> = yield* this.subEventsIterable() as any

                for (let childEvent of subEventsIterator) {
                    const childDate : Date = yield childEvent.$.earlyEndDate

                    if (childDate && childDate > result) result = childDate
                }

                return result.getTime() - MIN_DATE.getTime() ? result : null
            }

            if (yield this.$.manuallyScheduled) {
                return yield this.$.endDate
            }

            if (!(yield* this.isConstrainedEarly())) {
                return yield this.$.endDate
            }

            const effectiveInterval = yield this.$.earlyEffectiveEndDateInterval

            if (effectiveInterval === null) {
                return null
            }
            else if (effectiveInterval.isIntervalEmpty()) {
                const conflict  = ConflictEffect.new()

                if ((yield conflict) === ConflictResolutionResult.Cancel) {
                    yield Reject(conflict)
                } else {
                    return null
                }
            }

            return isDateFinite(effectiveInterval.startDate) ? effectiveInterval.startDate : null
        }


        @calculate('earlyEndDate')
        * calculateEarlyEndDate () : CalculationIterator<Date | boolean> {
            const date : Date = yield this.$.earlyEndDateRaw

            return yield* this.maybeSkipNonWorkingTime(date, false)
        }


        * isConstrainedEarly () : CalculationIterator<boolean> {
            const startDateIntervals : DateInterval[]                   = yield this.$.startDateConstraintIntervals
            const endDateIntervals : DateInterval[]                     = yield this.$.endDateConstraintIntervals
            const earlyStartDateConstraintIntervals : DateInterval[]    = yield this.$.earlyStartDateConstraintIntervals
            const earlyEndDateConstraintIntervals : DateInterval[]      = yield this.$.earlyEndDateConstraintIntervals

            return Boolean(startDateIntervals?.length || endDateIntervals?.length || earlyStartDateConstraintIntervals?.length || earlyEndDateConstraintIntervals?.length)
        }


        * calculateStartDatePure () : CalculationIterator<Date> {
            const direction : Direction     = yield this.$.direction

            if (direction === Direction.Forward) {
                // early exit if this mixin is not applicable, but only after(!) the direction check
                // this is because the `isConstrainedEarly` yield early constraint intervals, which are generally lazy,
                // depending from the direction
                if (!(yield* this.isConstrainedEarly()) || (yield this.$.manuallyScheduled) || (yield* this.hasSubEvents())) {
                    return yield* superProto.calculateStartDatePure.call(this)
                }

                return (yield this.$.earlyStartDate) || (yield* superProto.calculateStartDatePure.call(this))
            }
            else {
                return yield* superProto.calculateStartDatePure.call(this)
            }
        }


        * calculateStartDateProposed () : CalculationIterator<Date> {
            const direction : Direction     = yield this.$.direction

            switch (direction) {
                case Direction.Forward:
                    // early exit if this mixin is not applicable, but only after(!) the direction check
                    // this is because the `isConstrainedEarly` yield early constraint intervals, which are generally lazy,
                    // depending from the direction
                    if (!(yield* this.isConstrainedEarly()) || (yield this.$.manuallyScheduled) || (yield* this.hasSubEvents())) {
                        return yield* superProto.calculateStartDateProposed.call(this)
                    }

                    const autoStartDate     = yield this.$.earlyStartDate

                    if (autoStartDate) {
                        if (isDateFinite(autoStartDate)) return autoStartDate

                        const baseSchedulingStartDate : Date                    = yield* superProto.calculateStartDateProposed.call(this)
                        const earlyEffectiveStartDateInterval : DateInterval    = yield this.$.earlyEffectiveStartDateInterval

                        if (earlyEffectiveStartDateInterval.containsDate(baseSchedulingStartDate)) return baseSchedulingStartDate

                        return isDateFinite(earlyEffectiveStartDateInterval.endDate) ? earlyEffectiveStartDateInterval.endDate : baseSchedulingStartDate
                    } else {
                        return yield* superProto.calculateStartDateProposed.call(this)
                    }
                default:
                    return yield* superProto.calculateStartDateProposed.call(this)
            }
        }


        * calculateEndDatePure () : CalculationIterator<Date> {
            const direction : Direction     = yield this.$.direction

            if (direction === Direction.Forward) {
                // early exit if this mixin is not applicable, but only after(!) the direction check
                // this is because the `isConstrainedEarly` yield early constraint intervals, which are generally lazy,
                // depending from the direction
                if (!(yield* this.isConstrainedEarly()) || (yield this.$.manuallyScheduled) || (yield* this.hasSubEvents())) {
                    return yield* superProto.calculateEndDatePure.call(this)
                }

                return (yield this.$.earlyEndDate) || (yield* superProto.calculateEndDatePure.call(this))
            }
            else {
                return yield* superProto.calculateEndDatePure.call(this)
            }
        }


        * calculateEndDateProposed () : CalculationIterator<Date> {
            const direction : Direction     = yield this.$.direction

            switch (direction) {
                case Direction.Forward:
                    // early exit if this mixin is not applicable, but only after(!) the direction check
                    // this is because the `isConstrainedEarly` yield early constraint intervals, which are generally lazy,
                    // depending from the direction
                    if (!(yield* this.isConstrainedEarly()) || (yield this.$.manuallyScheduled) || (yield* this.hasSubEvents())) {
                        return yield* superProto.calculateEndDateProposed.call(this)
                    }

                    const autoEndDate     = yield this.$.earlyEndDate

                    if (autoEndDate) {
                        if (isDateFinite(autoEndDate)) return autoEndDate

                        const baseSchedulingEndDate : Date                  = yield* superProto.calculateEndDateProposed.call(this)
                        const earlyEffectiveEndDateInterval : DateInterval  = yield this.$.earlyEffectiveEndDateInterval

                        if (earlyEffectiveEndDateInterval.containsDate(baseSchedulingEndDate)) return baseSchedulingEndDate

                        return isDateFinite(earlyEffectiveEndDateInterval.endDate) ? earlyEffectiveEndDateInterval.endDate : baseSchedulingEndDate
                    } else {
                        return yield* superProto.calculateEndDateProposed.call(this)
                    }
                default:
                    return yield* superProto.calculateEndDateProposed.call(this)
            }
        }


        // // TODO make this method smart in regard of providing conflict resolution information
        // /**
        //  * Finds the intersection of provided intervals.
        //  * If some of the intervals doesn't intersect the methods yields IntervalConflict
        //  * with the interval reference.
        //  * @param intervals Intervals to find intersection of
        //  * @private
        //  */
        // * validateIntervalsIntersection (intervals : DateInterval[]) : CalculationIterator<DateInterval> {
        //     let intersection : DateInterval = DateInterval.new()
        //
        //     for (let interval of intervals) {
        //         intersection = intersection.intersect(interval)
        //
        //         // TODO: trigger conflict here
        //         if (intersection.isIntervalEmpty()) {
        //             // if some interval has no intersection w/ other(s) we throw a conflict
        //             // yield IntervalConflict.new({ conflictingInterval : interval })
        //         }
        //     }
        //
        //     return intersection
        // }


        // * calculateStartDateIntervalsByEndDateIntervals (intervals : DateInterval[]) : CalculationIterator<Date | DateInterval[]> {
        //     let result : DateInterval[] = []

        //     for (let interval of intervals) {
        //         result.push(DateInterval.new({
        //             onRemoveAction    : interval.onRemoveAction,
        //             originDescription : interval.originDescription,
        //             startDate         : interval.startDateIsFinite() ? yield* this.calculateProjectedStartDate(interval.startDate) : null,
        //             endDate           : interval.endDateIsFinite() ? yield* this.calculateProjectedStartDate(interval.endDate) : null,
        //         }))
        //     }

        //     return result
        // }


        // * calculateEndDateIntervalsByStartDateIntervals (intervals : DateInterval[]) : CalculationIterator<Date | DateInterval[]> {
        //     let result : DateInterval[] = []

        //     for (let interval of intervals) {
        //         result.push(DateInterval.new({
        //             onRemoveAction    : interval.onRemoveAction,
        //             originDescription : interval.originDescription,
        //             startDate         : interval.startDateIsFinite() ? yield* this.calculateProjectedEndDate(interval.startDate) : null,
        //             endDate           : interval.endDateIsFinite() ? yield* this.calculateProjectedEndDate(interval.endDate) : null,
        //         }))
        //     }

        //     return result
        // }


        // // Indicates if calculateProjectedStartDate and calculateProjectedStartDate method can calculate values.
        // * canCalculateProjectedXDate () : CalculationIterator<boolean> {
        //     return true
        // //     // need to have duration value
        // //     return !(yield* this.shouldRecalculateDuration())
        // }


        // TODO: add intervals validation
        // @calculate('validInitialIntervals')
        // * calculateValidInitialIntervals () : CalculationIterator<this[ 'validInitialIntervals' ]> {

        //     const startDateIntervals : DateInterval[] = yield this.$.startDateConstraintIntervals
        //     const endDateIntervals : DateInterval[]   = yield this.$.endDateConstraintIntervals

        //     // calculate effective start date constraining interval
        //     let startDateInterval : DateInterval = intersectIntervals(startDateIntervals)
        //     // calculate effective end date constraining interval
        //     let endDateInterval : DateInterval   = intersectIntervals(endDateIntervals)

        //     const canCalculateProjectedXDate = yield* this.canCalculateProjectedXDate()

        //     // if we can't use calculateProjectedStartDate/calculateProjectedEndDate methods then we cannot do anything else -> return
        //     if (!canCalculateProjectedXDate && !startDateInterval.isIntervalEmpty() && !endDateInterval.isIntervalEmpty()) {
        //         return {
        //             startDateInterval,
        //             endDateInterval
        //         }
        //     }

        //     const additionalConstraintForStartDate  = DateInterval.new({
        //         startDate   : endDateInterval.startDateIsFinite() ? yield* this.calculateProjectedStartDate(endDateInterval.startDate) : null,
        //         endDate     : endDateInterval.endDateIsFinite() ? yield* this.calculateProjectedStartDate(endDateInterval.endDate) : null,
        //     })

        //     startDateInterval = startDateInterval.intersect(additionalConstraintForStartDate)

        //     // If no intersection w/ additional interval let's intersects intervals one by one
        //     // and yield Conflict
        //     if (startDateInterval.isIntervalEmpty()) {
        //         const reflectedIntervals = yield* this.calculateStartDateIntervalsByEndDateIntervals(endDateIntervals)

        //         let combinedIntervals

        //         if (startDateIntervals.length > 1) {
        //             combinedIntervals = startDateIntervals
        //                 .slice(0, startDateIntervals.length - 1)
        //                 .concat(reflectedIntervals)
        //                 .concat(startDateIntervals[startDateIntervals.length - 1])
        //         } else {
        //             combinedIntervals = startDateIntervals.concat(reflectedIntervals)
        //         }

        //         yield* this.validateIntervalsIntersection(combinedIntervals)

        //     } else {

        //         const additionalConstraintForEndDate    = DateInterval.new({
        //             startDate   : startDateInterval.startDateIsFinite() ? yield* this.calculateProjectedEndDate(startDateInterval.startDate) : null,
        //             endDate     : startDateInterval.endDateIsFinite() ? yield* this.calculateProjectedEndDate(startDateInterval.endDate) : null,
        //         })

        //         endDateInterval = endDateInterval.intersect(additionalConstraintForEndDate)
        //     }

        //     return {
        //         startDateInterval,
        //         endDateInterval
        //     }
        // }


        @calculate('direction')
        * calculateDirection () : CalculationIterator<Direction> {
            const project = this.getProject()

            return yield project.$.direction
        }
    }

    return ConstrainedEarlyEventMixin
}){}
