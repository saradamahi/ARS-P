import { AnyConstructor, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js"
import { generic_field } from "../../../../ChronoGraph/replica/Entity.js"
import { ModelBucketField } from "../../../chrono/ModelFieldAtom.js"
import { BaseEventMixin } from "./BaseEventMixin.js"
import { SchedulerBasicProjectMixin } from "./SchedulerBasicProjectMixin.js"
import { AbstractHasAssignmentsMixin } from '../AbstractHasAssignmentsMixin.js'

/**
 * This is a mixin, which can be applied to the [[BaseEventMixin]]. It provides the collection of all assignments,
 * which reference this event.
 *
 * Doesn't affect scheduling.
 */
export class BaseHasAssignmentsMixin extends Mixin(
    [ BaseEventMixin, AbstractHasAssignmentsMixin ],
    (base : AnyConstructor<BaseEventMixin & AbstractHasAssignmentsMixin, typeof BaseEventMixin & typeof AbstractHasAssignmentsMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class BaseHasAssignmentsMixin extends base {
        project     : SchedulerBasicProjectMixin

        // currently the prototype must have at least one field declared with @model_field decorator,
        // for the `injectStaticFieldsProperty` function to be called
        // otherwise, the "common" fields won't be created on the model
        // this behavior should be contained in the `ModelField` itself somehow

        /**
         * A set of resources assigned to this task
         */
        @generic_field({}, ModelBucketField)
        assigned    : Set<InstanceType<this[ 'project' ][ 'assignmentModelClass' ]>>

        get assignments () {
            return this.assigned ? [ ...this.assigned ] : []
        }
    }

    return BaseHasAssignmentsMixin
}){}

