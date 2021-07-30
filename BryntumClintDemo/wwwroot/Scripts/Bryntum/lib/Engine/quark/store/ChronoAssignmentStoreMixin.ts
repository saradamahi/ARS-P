import { AnyConstructor, Mixin } from "../../../ChronoGraph/class/BetterMixin.js"
import { BaseAssignmentMixin } from "../model/scheduler_basic/BaseAssignmentMixin.js"
import { SchedulerBasicProjectMixin } from "../model/scheduler_basic/SchedulerBasicProjectMixin.js"
import { ChronoPartOfProjectStoreMixin } from "./mixin/ChronoPartOfProjectStoreMixin.js"
import { AbstractAssignmentStoreMixin } from "./AbstractAssignmentStoreMixin.js"

/**
 * A store mixin class, that represent collection of all assignments in the [[SchedulerBasicProjectMixin|project]].
 */
export class ChronoAssignmentStoreMixin extends Mixin(
    [ AbstractAssignmentStoreMixin, ChronoPartOfProjectStoreMixin ],
    (base : AnyConstructor<AbstractAssignmentStoreMixin & ChronoPartOfProjectStoreMixin, typeof AbstractAssignmentStoreMixin & typeof ChronoPartOfProjectStoreMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class ChronoAssignmentStoreMixin extends base {

        project             : SchedulerBasicProjectMixin

        modelClass          : this[ 'project' ][ 'assignmentModelClass' ]


        static get defaultConfig () : object {
            return {
                modelClass  : BaseAssignmentMixin
            }
        }


        set data (value) {
            this.allAssignmentsForRemoval   = true

            super.data = value

            this.allAssignmentsForRemoval   = false
        }
    }

    return ChronoAssignmentStoreMixin
}){}

