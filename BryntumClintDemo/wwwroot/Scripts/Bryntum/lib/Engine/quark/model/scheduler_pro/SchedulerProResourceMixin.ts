import { AnyConstructor, Base, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js"
import { CalculationIterator } from "../../../../ChronoGraph/primitives/Calculation.js"
import { calculate, Entity, field } from "../../../../ChronoGraph/replica/Entity.js"
import { Replica } from "../../../../ChronoGraph/replica/Replica.js"
import { CalendarCacheIntervalMultiple } from "../../../calendar/CalendarCacheIntervalMultiple.js"
import { CalendarCacheMultiple } from "../../../calendar/CalendarCacheMultiple.js"
import { CalendarIntervalMixin } from "../../../calendar/CalendarIntervalMixin.js"
import { CalendarIntervalStore } from "../../../calendar/CalendarIntervalStore.js"
import { CalendarIteratorResult } from "../../../calendar/CalendarCache.js"
import { model_field } from "../../../chrono/ModelFieldAtom.js"
import { BaseCalendarMixin } from "../scheduler_basic/BaseCalendarMixin.js"
import { BaseEventMixin } from "../scheduler_basic/BaseEventMixin.js"
import { BaseResourceMixin } from "../scheduler_basic/BaseResourceMixin.js"
import { SchedulerProProjectMixin } from "./SchedulerProProjectMixin.js"
import { SchedulerProAssignmentMixin } from "./SchedulerProAssignmentMixin.js"
import { CalculatedValueGen, Identifier } from "../../../../ChronoGraph/chrono/Identifier.js"

export class ResourceAllocationEventRangeCalendarIntervalMixin extends CalendarIntervalMixin {

    // @model_field({ type : 'boolean', defaultValue : true })
    // isWorking : boolean

    // Calendar classes not entering graph, thus not using @model_field
    static get fields () {
        return [
            { name : 'isWorking', type : 'boolean', defaultValue : true }
        ]
    }

    assignment : SchedulerProAssignmentMixin
}

export class ResourceAllocationEventRangeCalendarIntervalStore extends CalendarIntervalStore {

    modelClass : typeof ResourceAllocationEventRangeCalendarIntervalMixin

    static get defaultConfig () {
        return {
            modelClass      : ResourceAllocationEventRangeCalendarIntervalMixin
        }
    }
}

export class ResourceAllocationEventRangeCalendar extends BaseCalendarMixin {

    intervalStore               : ResourceAllocationEventRangeCalendarIntervalStore

    get intervalStoreClass () : typeof ResourceAllocationEventRangeCalendarIntervalStore {
        return ResourceAllocationEventRangeCalendarIntervalStore
    }

    @model_field({ type : 'boolean', defaultValue : false })
    unspecifiedTimeIsWorking : boolean
}

export class ResourceAllocationInterval extends Base {

    tick                : CalendarIntervalMixin

    resource            : BaseResourceMixin

    assignments         : Set<SchedulerProAssignmentMixin> = null

    effort              : number = 0

    maxEffort           : number = 0

    units               : number = 0

    isOverallocated     : boolean = false

    isUnderallocated    : boolean = false
}

export type ResourceAllocation = ResourceAllocationInterval[]

export class ResourceAllocationInfo extends Entity.mix(Base) {

    ticks                   : CalculatedValueGen<BaseCalendarMixin>

    @field()
    resource                : SchedulerProResourceMixin

    @field()
    allocation              : ResourceAllocation

    @calculate('allocation')
    * calculateAllocation () : CalculationIterator<this[ 'allocation' ]> {
        const
            result : ResourceAllocation                                                         = [],
            ticksCalendar : BaseCalendarMixin                                                   = yield this.ticks, //$.ticks,
            resource : SchedulerProResourceMixin                                                = yield this.$.resource,
            assignments : Set<SchedulerProAssignmentMixin>                                      = yield resource.$.assigned,
            assignmentsByCalendar : Map<BaseCalendarMixin, SchedulerProAssignmentMixin[]>       = new Map(),
            eventRanges : Partial<ResourceAllocationEventRangeCalendarIntervalMixin>[]          = []

        // collect the resource assignments into assignmentsByCalendar map
        for (const assignment of assignments) {
            const event : BaseEventMixin    = yield assignment.$.event

            // we're going to need up-to-date assignment "units" so yield it here
            yield assignment.$.units

            if (event) {
                // we're going to need up-to-date event start/end dates so yield them here

                const startDate : Date  = yield event.$.startDate,
                    endDate : Date      = yield event.$.endDate

                eventRanges.push({ startDate, endDate, assignment })

                const eventCalendar : BaseCalendarMixin   = yield event.$.effectiveCalendar

                let assignments     = assignmentsByCalendar.get(eventCalendar)

                if (!assignments) {
                    assignments     = []
                    assignmentsByCalendar.set(eventCalendar, assignments)
                }

                assignments.push(assignment)
            }
        }

        const eventRangesCalendar : ResourceAllocationEventRangeCalendar = new ResourceAllocationEventRangeCalendar({ intervals : eventRanges })

        // Provide extra calendars:
        // 1) a calendar containing list of ticks to group the resource allocation by
        // 2) a calendar containing list of assigned event start/end ranges
        // 3) assigned task calendars
        const calendars : BaseCalendarMixin[]   = [ ticksCalendar, eventRangesCalendar, ...assignmentsByCalendar.keys() ]

        const ticksData : Map<CalendarIntervalMixin, ResourceAllocationInterval> = new Map()

        // Initialize the resulting array with empty items

        ticksCalendar.intervalStore.forEach(tick => {
            const tickData : ResourceAllocationInterval   = ResourceAllocationInterval.new({ tick, resource })

            ticksData.set(tick, tickData)
            result.push(tickData)
        })

        let weightedUnitsSum : number,
            weightsSum : number

        yield* resource.forEachAvailabilityInterval(
            {
                startDate   : result[0].tick.startDate,
                endDate     : result[result.length - 1].tick.endDate,
                calendars
            },
            (intervalStartDate, intervalEndDate, intervalData) => {
                const isWorkingCalendar = intervalData.getCalendarsWorkStatus()

                // We are inside a tick interval and it's a working time according
                // to a resource calendar

                if (isWorkingCalendar.get(ticksCalendar)) {

                    const
                        tick                                        = intervalData.intervalsByCalendar.get(ticksCalendar)[0],
                        intervalDuration : number                   = intervalEndDate.getTime() - intervalStartDate.getTime(),
                        tickData : ResourceAllocationInterval       = ticksData.get(tick),
                        tickAssignments : Set<SchedulerProAssignmentMixin> = tickData.assignments || new Set()

                    if (!tickData.assignments) {
                        weightedUnitsSum        = 0
                        weightsSum              = 0
                    }

                    let units : number          = 0,
                        duration : number

                    intervalData.intervalsByCalendar.get(eventRangesCalendar).forEach((interval : ResourceAllocationEventRangeCalendarIntervalMixin) => {
                        const assignment : SchedulerProAssignmentMixin = interval.assignment

                        // TODO:
                        // We don't do yield "assignment.event.*" expressions since we did it previously
                        // while looping the assignments because we cannot yield from the iterator callback
                        if (assignment && isWorkingCalendar.get(assignment.event.effectiveCalendar)) {
                            // constrain the event start/end with the tick borders
                            const workingStartDate      = Math.max(intervalStartDate.getTime(), assignment.event.startDate.getTime())
                            const workingEndDate        = Math.min(intervalEndDate.getTime(), assignment.event.endDate.getTime())

                            duration                    = workingEndDate - workingStartDate

                            tickData.effort             += duration * assignment.units / 100

                            // collect total resource usage percent in the current interval
                            units                       += assignment.units

                            tickAssignments.add(assignment)
                        }
                    })

                    tickData.maxEffort          += intervalDuration

                    // if we have assignments running in the interval - calculate average allocation %
                    if (units) {
                        if (duration) {
                            // keep weightedUnitsSum & weightsSum since there might be another intervals in the tick
                            weightedUnitsSum            += duration * units
                            weightsSum                  += duration
                            // "units" weighted arithmetic mean w/ duration values as weights
                            tickData.units              = weightedUnitsSum / weightsSum
                        } else if (!weightedUnitsSum) {
                            tickData.units = units
                        }
                    }

                    if (tickAssignments.size) {
                        tickData.assignments        = tickAssignments
                        tickData.isOverallocated    = tickData.isOverallocated || units > 100
                        tickData.isUnderallocated   = tickData.isUnderallocated || units < 100
                    }
                }
            }
        )

        return result
    }

}


/**
 * A mixin for the resource entity at the Scheduler Pro level.
 */
export class SchedulerProResourceMixin extends Mixin(
    [ BaseResourceMixin ],
    (base : AnyConstructor<BaseResourceMixin, typeof BaseResourceMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class SchedulerProResourceMixin extends base {

        // w/o this `Omit` incremental compilation report false compilation error
        project                             : Omit<SchedulerProProjectMixin, 'resourceModelClass'> & { resourceModelClass : typeof SchedulerProResourceMixin }

        observers                           : Set<Identifier> = new Set()

        entities                            : Set<Entity> = new Set()

        leaveGraph (replica : Replica) {
            const { graph } = this

            for (const entity of this.entities) {
                graph.removeEntity(entity)
            }

            for (const observer of this.observers) {
                graph.removeIdentifier(observer)
            }

            superProto.leaveGraph.call(this, replica)
        }

        * forEachAvailabilityInterval (
            options     : {
                startDate?                          : Date,
                endDate?                            : Date,
                isForward?                          : boolean
                calendars?                          : BaseCalendarMixin[]
            },
            func        : (
                startDate                           : Date,
                endDate                             : Date,
                calendarCacheIntervalMultiple       : CalendarCacheIntervalMultiple
            ) => false | void
        ) : CalculationIterator<CalendarIteratorResult>
        {
            const calendar : BaseCalendarMixin = yield this.$.effectiveCalendar

            const effectiveCalendarsCombination : CalendarCacheMultiple = this.getProject().combineCalendars([ calendar ].concat(options.calendars || []))

            return effectiveCalendarsCombination.forEachAvailabilityInterval(
                options,
                (startDate : Date, endDate : Date, calendarCacheIntervalMultiple : CalendarCacheIntervalMultiple) => {
                    const calendarsStatus   = calendarCacheIntervalMultiple.getCalendarsWorkStatus()

                    if (calendarsStatus.get(calendar)) {
                        return func(startDate, endDate, calendarCacheIntervalMultiple)
                    }
                }
            )
        }

    }

    return SchedulerProResourceMixin
}){}
