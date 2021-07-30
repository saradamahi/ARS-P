import { AnyConstructor, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js"
import { generic_field } from "../../../../ChronoGraph/replica/Entity.js"
import { model_field, ModelBucketField } from "../../../chrono/ModelFieldAtom.js"
import { BaseEventMixin } from "./BaseEventMixin.js"
import { SchedulerBasicProjectMixin } from "./SchedulerBasicProjectMixin.js"


/**
 * This is a mixin, providing dependencies "awareness" for the event.
 *
 * Doesn't affect scheduling.
 */
export class HasDependenciesMixin extends Mixin(
    [ BaseEventMixin ],
    (base : AnyConstructor<BaseEventMixin, typeof BaseEventMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class HasDependenciesMixin extends base {
        project         : SchedulerBasicProjectMixin

        // currently the prototype must have at least one field declared with @model_field decorator,
        // for the `injectStaticFieldsProperty` function to be called
        // otherwise, the "common" fields won't be created on the model
        // this behavior should be contained in the `ModelField` itself somehow

        /**
         * A set of outgoing dependencies from this task (dependencies which starts at this task)
         */
        @generic_field({}, ModelBucketField)
        outgoingDeps    : Set<InstanceType<this[ 'project' ][ 'dependencyModelClass' ]>>

        /**
         * A set of incoming dependencies for this task (dependencies which ends at this task)
         */
        @generic_field({}, ModelBucketField)
        incomingDeps    : Set<InstanceType<this[ 'project' ][ 'dependencyModelClass' ]>>


        leaveProject () {
            const eventStore    = this.getEventStore()

            // the buckets may be empty if a model is removed from the project immediately after adding
            // (without propagation)
            if (this.outgoingDeps) {
                this.outgoingDeps.forEach(dependency => eventStore.dependenciesForRemoval.add(dependency))
            }

            if (this.incomingDeps) {
                this.incomingDeps.forEach(dependency => eventStore.dependenciesForRemoval.add(dependency))
            }

            superProto.leaveProject.call(this)
        }
    }

    return HasDependenciesMixin
}){}

