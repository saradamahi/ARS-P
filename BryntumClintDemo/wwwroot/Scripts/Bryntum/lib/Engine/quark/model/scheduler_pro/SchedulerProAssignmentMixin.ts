import { AnyConstructor, Mixin } from '../../../../ChronoGraph/class/BetterMixin.js'
import { model_field } from '../../../chrono/ModelFieldAtom.js'
import { BaseAssignmentMixin } from '../scheduler_basic/BaseAssignmentMixin.js'
import { CommitResult } from '../../../../ChronoGraph/chrono/Graph.js'


export class SchedulerProAssignmentMixin extends Mixin(
    [ BaseAssignmentMixin ],
    (base : AnyConstructor<BaseAssignmentMixin, typeof BaseAssignmentMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class SchedulerProAssignmentMixin extends base {

        /**
         * The numeric, percent-like value, indicating what is the "contribution level"
         * of the resource availability to the task.
         * Number 100, means that the assigned resource spends 100% of its working time to the task.
         * And number 50 means that the resource spends only half of its available time to the task.
         * @field {Number} units
         */
        @model_field({ type : 'number', defaultValue : 100 })
        units               : number

        /**
         * Generated getter for the [[units]] field
         */
        getUnits : () => Number

        /**
         * Generated setter for the [[units]] field
         */
        setUnits : (units : number) => Promise<CommitResult>
    }

    return SchedulerProAssignmentMixin
}){}
