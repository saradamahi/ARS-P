import { AnyConstructor, Mixin } from '../../../../ChronoGraph/class/BetterMixin.js'
import { generic_field } from "../../../../ChronoGraph/replica/Entity.js"
import { model_field, ModelBucketField } from '../../../chrono/ModelFieldAtom.js'
import { ChronoPartOfProjectModelMixin } from '../mixin/ChronoPartOfProjectModelMixin.js'
import { HasCalendarMixin } from './HasCalendarMixin.js'
import { SchedulerBasicProjectMixin } from "./SchedulerBasicProjectMixin.js"

/**
 * This is a base resource entity.
 */
export class BaseResourceMixin extends Mixin(
    [ HasCalendarMixin, ChronoPartOfProjectModelMixin ],
    (base : AnyConstructor<HasCalendarMixin & ChronoPartOfProjectModelMixin, typeof HasCalendarMixin & typeof ChronoPartOfProjectModelMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class BaseResourceMixin extends base {
        project             : SchedulerBasicProjectMixin

        // currently the prototype must have at least one field declared with @model_field decorator,
        // for the `injectStaticFieldsProperty` function to be called
        // otherwise, the "common" fields won't be created on the model
        // this behavior should be contained in the `ModelField` itself somehow

        /**
         * A set of events assigned to this resource
         */
        @generic_field({}, ModelBucketField)
        assigned        : Set<InstanceType<this[ 'project' ][ 'assignmentModelClass' ]>>


        get assignments () {
            return [ ...this.assigned ]
        }


        leaveProject (isReplacing : boolean = false) {
            // `this.assigned` will be empty if model is added to project and then removed immediately
            // w/o any propagations
            // when replacing a resource, the assignments should be left intact
            if (this.assigned && !isReplacing) {
                const resourceStore    = this.getResourceStore()

                // to batch the assignments removal, we don't remove the assignments right away, but instead
                // add them for the batched removal to the `assignmentsForRemoval` property of the event store
                this.assigned.forEach(assignment => resourceStore.assignmentsForRemoval.add(assignment))
            }

            superProto.leaveProject.call(this)
        }
    }

    return BaseResourceMixin
}){}

