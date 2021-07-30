import { AnyConstructor, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js"
import { field } from "../../../../ChronoGraph/replica/Entity.js"
import { CalendarIntervalMixin } from "../../../calendar/CalendarIntervalMixin.js"
import { model_field } from "../../../chrono/ModelFieldAtom.js"
import { ChronoPartOfProjectModelMixin } from "../mixin/ChronoPartOfProjectModelMixin.js"
import { SchedulerBasicProjectMixin } from "./SchedulerBasicProjectMixin.js"
import { AbstractCalendarMixin } from "../AbstractCalendarMixin.js"

const hasMixin = Symbol('CalendarMixin')

/**
 * The calendar for project scheduling, it is used to mark certain time intervals as "non-working" and ignore them during scheduling.
 *
 * The calendar consists from several [[CalendarIntervalMixin|intervals]]. The intervals can be either static or recurrent.
 */
export class BaseCalendarMixin extends Mixin(
    [
        AbstractCalendarMixin,
        ChronoPartOfProjectModelMixin
    ],
    (base : AnyConstructor<
        AbstractCalendarMixin &
        ChronoPartOfProjectModelMixin
        ,
        typeof AbstractCalendarMixin &
        typeof ChronoPartOfProjectModelMixin
>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class BaseCalendarMixin extends base {

        [hasMixin] () {}

        project                 : SchedulerBasicProjectMixin

        @field({ persistent : false })
        version                 : number    = 1

        /**
         * The calendar name
         */
        @model_field({ type : 'string' })
        name                    : string

        /**
         * The flag, indicating, whether the "unspecified" time (time that does not belong to any [[CalendarIntervalMixin|interval]])
         * is working (`true`) or not (`false`). Default value is `true`
         */
        @model_field({ type : 'boolean', defaultValue : true })
        unspecifiedTimeIsWorking : boolean

        @model_field()
        intervals                : Partial<CalendarIntervalMixin>[]


        // // this makes the calendar's self-atom to change (and trigger calculation on outgoing edges) on every `version` change
        // * calculateSelf () : CalculationIterator<this> {
        //     yield this.$.version
        //
        //     return this
        // }


    }

    return BaseCalendarMixin
}){}

