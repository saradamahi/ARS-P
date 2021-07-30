import { AnyConstructor, Mixin } from "../../../ChronoGraph/class/BetterMixin.js"
import { BaseResourceMixin } from "../model/scheduler_basic/BaseResourceMixin.js"
import { SchedulerBasicProjectMixin } from "../model/scheduler_basic/SchedulerBasicProjectMixin.js"
import { ChronoPartOfProjectStoreMixin } from "./mixin/ChronoPartOfProjectStoreMixin.js"
import { AbstractResourceStoreMixin } from "./AbstractResourceStoreMixin.js"

/**
 * A store mixin class, that represent collection of all resources in the [[SchedulerBasicProjectMixin|project]].
 */
export class ChronoResourceStoreMixin extends Mixin(
    [ AbstractResourceStoreMixin, ChronoPartOfProjectStoreMixin ],
    (base : AnyConstructor<AbstractResourceStoreMixin & ChronoPartOfProjectStoreMixin, typeof AbstractResourceStoreMixin & typeof ChronoPartOfProjectStoreMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class ChronoResourceStoreMixin extends base {

        project             : SchedulerBasicProjectMixin

        modelClass          : this[ 'project' ][ 'resourceModelClass' ]


        static get defaultConfig () : object {
            return {
                modelClass  : BaseResourceMixin
            }
        }

    }

    return ChronoResourceStoreMixin
}){}
