import { CommitResult } from "../../../../ChronoGraph/chrono/Graph.js"
import { AnyConstructor, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js"
import { CalculationIterator } from "../../../../ChronoGraph/primitives/Calculation.js"
import { calculate, field, generic_field, write } from "../../../../ChronoGraph/replica/Entity.js"
import { CalendarCacheMultiple } from "../../../calendar/CalendarCacheMultiple.js"
import { injectStaticFieldsProperty, isSerializableEqual, ModelReferenceField } from '../../../chrono/ModelFieldAtom.js'
import { stripDuplicates } from "../../../util/StripDuplicates.js"
import { ModelId } from "../../Types.js"
import { ChronoPartOfProjectModelMixin } from "../mixin/ChronoPartOfProjectModelMixin.js"
import { BaseCalendarMixin } from "./BaseCalendarMixin.js"
import { ChronoAbstractProjectMixin } from "./ChronoAbstractProjectMixin.js"
import { Identifier } from "../../../../ChronoGraph/chrono/Identifier.js"
import { Transaction } from "../../../../ChronoGraph/chrono/Transaction.js"
import { Quark } from "../../../../ChronoGraph/chrono/Quark.js"

/**
 * This mixin provides the calendar to any [[ChronoPartOfProjectModelMixin]] it is mixed in.
 *
 * If user provides no calendar, the calendar is taken from the project.
 */
export class HasCalendarMixin extends Mixin(
    [ ChronoPartOfProjectModelMixin ],
    (base : AnyConstructor<ChronoPartOfProjectModelMixin, typeof ChronoPartOfProjectModelMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class HasCalendarMixin extends base {
        project                 : ChronoAbstractProjectMixin & HasCalendarMixin

        /**
         * The effective calendar used by this entity (either its own [[calendar]] if provided or the project calendar).
         */
        @field()
        effectiveCalendar       : BaseCalendarMixin

        /**
         * The calendar of this entity.
         */
        @generic_field(
            {
                modelFieldConfig : {
                    persist   : true,
                    serialize : calendar => calendar?.id,
                    isEqual   : isSerializableEqual
                },
                resolver : function (locator) {
                    return this.resolveCalendar(locator)
                },
                sync     : true
            },
            ModelReferenceField
        )
        calendar            : BaseCalendarMixin

        /**
         * Sets the [[calendar]]. The method triggers schedule change propagation and returns a `Promise`:
         *
         * ```ts
         * // set calendar
         * model.setCalendar(calendar1).then(() => {
         *     // some code to run after schedule got updated
         *     ...
         * })
         *
         * ```
         *
         * It also adds the calendar to the project calendar manager.
         */
        setCalendar : (calendar : BaseCalendarMixin | ModelId) => Promise<CommitResult>
        /**
         * Gets the [[calendar]].
         */
        getCalendar : () => BaseCalendarMixin

        @write('calendar')
        writeCalendar (me : Identifier, transaction : Transaction, quark : Quark, calendar : BaseCalendarMixin) {
            const calendarManagerStore      = this.getCalendarManagerStore()
            const cal                       = calendar as any

            // add calendar to the calendar manager - if the calendar is not there yet
            if (calendar && calendarManagerStore && calendar instanceof BaseCalendarMixin && !calendarManagerStore.includes(cal)) {
                calendarManagerStore.add(calendar as any)
            }

            me.constructor.prototype.write.call(this, me, transaction, quark, calendar)
        }

        resolveCalendar (locator : string) {
            return this.getCalendarManagerStore()?.getById(locator)
        }

        /**
         * Calculation method of the [[effectiveCalendar]]. Takes the calendar from the project, if not provided to the entity explicitly.
         */
        @calculate('effectiveCalendar')
        * calculateEffectiveCalendar () : CalculationIterator<BaseCalendarMixin> {
            let calendar : BaseCalendarMixin  = yield this.$.calendar

            if (!calendar) {
                const project   = this.getProject()

                calendar        = yield project.$.effectiveCalendar
            }

            // this will create an incoming edge from the calendar's version atom, which changes on calendar's data update
            yield calendar.$.version

            return calendar
        }
    }

    // inject "fields" getter override to apply "modelFieldConfig" to "event" & "resource" fields
    injectStaticFieldsProperty(HasCalendarMixin)

    return HasCalendarMixin
}){}



// TODO handle the calendars deletion
/**
 * This mixin provides the consuming class with the [[combineCalendars]] method, which can combine several calendars.
 */
export class CanCombineCalendarsMixin extends Mixin(
    [],
    (base : AnyConstructor) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class CanCombineCalendars extends base {

        combinedcalendarscache  : Map<string, { versionsHash : string, cache : CalendarCacheMultiple }>     = new Map()

        /**
         * Combines an array of calendars into a single [[CalendarCacheMultiple]], which provides an API similar (but not exactly the same) to [[BaseCalendarMixin]]
         *
         * @param calendars
         */
        combineCalendars (calendars : BaseCalendarMixin[]) : CalendarCacheMultiple {
            const uniqueOnly    = stripDuplicates(calendars)

            if (uniqueOnly.length === 0) throw new Error("No calendars to combine")

            uniqueOnly.sort(( calendar1, calendar2 ) => {
                if (calendar1.internalId < calendar2.internalId)
                    return -1
                else
                    return 1
            })

            const hash          = uniqueOnly.map(calendar => calendar.internalId + '/').join('')
            const versionsHash  = uniqueOnly.map(calendar => calendar.version + '/').join('')

            const cached        = this.combinedcalendarscache.get(hash)

            let res : CalendarCacheMultiple

            if (cached && cached.versionsHash === versionsHash)
                res             = cached.cache
            else {
                res             = new CalendarCacheMultiple({ calendarCaches : uniqueOnly.map(calendar => calendar.calendarCache ) })

                this.combinedcalendarscache.set(hash, {
                    versionsHash    : versionsHash,
                    cache           : res
                })
            }

            return res
        }
    }

    return CanCombineCalendars
}){}
