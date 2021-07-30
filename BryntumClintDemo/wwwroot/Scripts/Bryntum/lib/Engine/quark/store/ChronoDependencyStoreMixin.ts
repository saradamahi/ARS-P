import { AnyConstructor, Mixin } from "../../../ChronoGraph/class/BetterMixin.js"
import { SchedulerBasicProjectMixin } from "../model/scheduler_basic/SchedulerBasicProjectMixin.js"
import { ChronoPartOfProjectStoreMixin } from "./mixin/ChronoPartOfProjectStoreMixin.js"
import { AbstractDependencyStoreMixin } from "./AbstractDependencyStoreMixin.js"


/**
 * A store mixin class, that represent collection of all dependencies in the [[SchedulerBasicProjectMixin|project]].
 */
export class ChronoDependencyStoreMixin extends Mixin(
    [ AbstractDependencyStoreMixin, ChronoPartOfProjectStoreMixin ],
    (base : AnyConstructor<AbstractDependencyStoreMixin & ChronoPartOfProjectStoreMixin, typeof AbstractDependencyStoreMixin & typeof ChronoPartOfProjectStoreMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class ChronoDependencyStoreMixin extends base {

        project             : SchedulerBasicProjectMixin

        modelClass          : this[ 'project' ][ 'dependencyModelClass' ]


        set data (value) {
            this.allDependenciesForRemoval   = true

            super.data = value

            this.allDependenciesForRemoval   = false
        }

    }

    return ChronoDependencyStoreMixin
}){}
