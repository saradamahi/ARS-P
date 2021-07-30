import { CommitResult } from "../../../../ChronoGraph/chrono/Graph.js"
import { Identifier } from '../../../../ChronoGraph/chrono/Identifier.js'
import { Quark } from "../../../../ChronoGraph/chrono/Quark.js"
import { Transaction } from '../../../../ChronoGraph/chrono/Transaction.js'
import { AnyConstructor, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js"
import { CalculationIterator } from '../../../../ChronoGraph/primitives/Calculation.js'
import { calculate, field, write } from '../../../../ChronoGraph/replica/Entity.js'
import { isAtomicValue } from '../../../../ChronoGraph/util/Helpers.js'
import DateHelper from '../../../../Core/helper/DateHelper.js'
import { model_field } from '../../../chrono/ModelFieldAtom.js'
import { DependenciesCalendar, Duration, TimeUnit } from '../../../scheduling/Types.js'
import { BaseCalendarMixin } from '../scheduler_basic/BaseCalendarMixin.js'
import { BaseDependencyMixin } from '../scheduler_basic/BaseDependencyMixin.js'
import { SchedulerProProjectMixin } from "./SchedulerProProjectMixin.js"


//---------------------------------------------------------------------------------------------------------------------
/**
 * A mixin for the dependency entity at the Scheduler Pro level. It adds [[lag]] and [[lagUnit]] fields.
 *
 * The calendar according to which the lag time is calculated is defined with the
 * [[SchedulerProProjectMixin.dependenciesCalendar|dependenciesCalendar]] config of the project.
 */
export class SchedulerProDependencyMixin extends Mixin(
    [ BaseDependencyMixin ],
    (base : AnyConstructor<BaseDependencyMixin, typeof BaseDependencyMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class SchedulerProDependencyMixin extends base {

        project : SchedulerProProjectMixin

        /**
         * The lag (lead) for dependency.
         * Negative values can be used to provide lead. Please note, that only _working time_ is counted in.
         * The _working time_ is defined with the dependency [[calendar]] which
         * configured on the project level with [[SchedulerProProjectMixin.dependenciesCalendar|dependenciesCalendar]] option
         * (by default successor event calendar is used).
         *
         * See also [[lagUnit]]
         */
        @model_field({ type : 'number', defaultValue : 0 })
        lag                 : Duration

        /**
         * The duration unit for the [[lag|dependency lag]]
         */
        @model_field({ type : 'string', defaultValue : TimeUnit.Day }, { converter : DateHelper.normalizeUnit })
        lagUnit             : TimeUnit

        /**
         * The calendar of the dependency used to take [[lag]] duration into account.
         */
        @field()
        calendar            : BaseCalendarMixin

        /**
         * Active dependencies affect intervals for event start date, non active are ignored.
         */
        @model_field({ type : 'boolean', defaultValue : true, persist : false })
        active              : Boolean


        @calculate('calendar')
        * calculateCalendar () : CalculationIterator<BaseCalendarMixin> {
            const project : SchedulerProProjectMixin   = this.getProject()
            const dependenciesCalendar          = yield project.$.dependenciesCalendar

            let calendar : BaseCalendarMixin

            switch (dependenciesCalendar) {
                case DependenciesCalendar.Project:
                    calendar            = yield project.$.effectiveCalendar
                    break
                case DependenciesCalendar.FromEvent:
                    const fromEvent     = yield this.$.fromEvent
                    calendar            = fromEvent && !isAtomicValue(fromEvent) ? yield fromEvent.$.effectiveCalendar : null
                    break
                case DependenciesCalendar.ToEvent:
                    const toEvent       = yield this.$.toEvent
                    calendar            = toEvent && !isAtomicValue(toEvent) ? yield toEvent.$.effectiveCalendar : null
                    break
            }

            // the only case when there will be no calendar is when there's no either from/to event
            // what to return in such case? use project calendar as "defensive" approach
            if (!calendar) calendar     = yield project.$.effectiveCalendar

            return calendar
        }

        /**
         * Generated getter for the [[lag]].
         */
        getLag : () => Duration

        /**
         * Setter for the [[lag]]. Can also set [[lagUnit]] if second argument is provided.
         *
         * @param lag
         * @param unit
         */
        async setLag (lag : Duration, unit? : TimeUnit) : Promise<CommitResult> {
            if (this.graph) {
                this.graph.write(this.$.lag, lag, unit)

                return this.graph.commitAsync()
            } else {
                this.$.lag.DATA = lag

                if (unit != null) this.$.lagUnit.DATA = unit
            }
        }


        @write('lag')
        writeLag (me : Identifier, transaction : Transaction, quark : Quark, lag : Duration, unit : TimeUnit = undefined) {
            me.constructor.prototype.write.call(this, me, transaction, quark, lag)

            if (unit != null) transaction.write(this.$.lagUnit, unit)
        }
    }

    return SchedulerProDependencyMixin
}){}

// /**
//  * Dependency entity mixin type
//  */
// export type SchedulerProDependencyMixin = Mixin<typeof SchedulerProDependencyMixin>
//
// export interface SchedulerProDependencyMixinI extends Mixin<typeof SchedulerProDependencyMixin> {}
//
// export const BuildSchedulerProDependency = (base) => SchedulerProDependencyMixin(BuildMinimalBaseDependency(base))
//
// export class MinimalSchedulerProDependency extends SchedulerProDependencyMixin(MinimalBaseDependency) {}
