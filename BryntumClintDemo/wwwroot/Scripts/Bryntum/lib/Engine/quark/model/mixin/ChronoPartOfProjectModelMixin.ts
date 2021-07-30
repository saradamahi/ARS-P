import { AnyConstructor, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js"
import { ChronoModelMixin } from "../../../chrono/ChronoModelMixin.js"
import { EngineReplica } from "../../../chrono/Replica.js"
import { ChronoPartOfProjectGenericMixin } from "../../ChronoPartOfProjectGenericMixin.js"
import { ChronoPartOfProjectStoreMixin } from "../../store/mixin/ChronoPartOfProjectStoreMixin.js"
import { AbstractPartOfProjectModelMixin } from "./AbstractPartOfProjectModelMixin.js"
import { isInstanceOf } from '../../../../ChronoGraph/class/Mixin.js'


/**
 * This a base mixin for every Model that belongs to a ChronoGraph powered project.
 *
 * The model with this mixin, supposes that it will be "joining" a store that is already part of a project,
 * so that such model can take a reference to the project from it.
 *
 * It provides 2 template methods [[joinProject]] and [[leaveProject]], which can be overridden in other mixins
 * (they should always call `super` implementation, because it adds/remove the model to/from the ChronoGraph instance)
 */
export class ChronoPartOfProjectModelMixin extends Mixin(
    [
        AbstractPartOfProjectModelMixin,
        ChronoPartOfProjectGenericMixin,
        ChronoModelMixin
    ],
    (base : AnyConstructor<
        AbstractPartOfProjectModelMixin &
        ChronoPartOfProjectGenericMixin &
        ChronoModelMixin
        ,
        typeof AbstractPartOfProjectModelMixin &
        typeof ChronoPartOfProjectGenericMixin &
        typeof ChronoModelMixin
>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class ChronoPartOfProjectModelMixin extends base {

        stores           : ChronoPartOfProjectStoreMixin[]

        /**
         * Template method, which is called when model is joining the project (through joining some store that
         * has already joined the project)
         */
        joinProject () {
            (this.getGraph() as EngineReplica).addEntity(this)
        }


        /**
         * Template method, which is called when model is leaving the project (through leaving some store usually)
         */
        leaveProject (isReplacing : boolean = false) {
            superProto.leaveProject.call(this, isReplacing)

            const replica = this.getGraph() as EngineReplica

            replica.removeEntity(this)

            // @ts-ignore
            this.graph = null
        }


        /**
         * Returns a [[SchedulerBasicProjectMixin|project]] instance
         */
        getProject () {
            return superProto.getProject.call(this)
        }


        calculateProject () : this[ 'project' ] {
            const store = this.stores.find(s => (isInstanceOf(s, ChronoPartOfProjectStoreMixin)) && !!s.getProject())

            return store?.getProject()
        }


        // afterSet (field, value, silent, fromRelationUpdate, beforeResult, wasSet) : void {
        //     // When undoing old data is set directly to the data object bypassing
        //     // accessors, which puts atoms like constraintDate into outdated state.
        //     // Iterating over modified fields and updating required atoms manually
        //     if (wasSet && this.getProject() && this.getProject().getStm().isRestoring) {
        //         Object.keys(wasSet).forEach(key => {
        //             const atom = this.$[key]
        //             // touch atoms affected by undo operation
        //             if (atom && atom.graph) {
        //                 atom.graph.markAsNeedRecalculation(atom)
        //             }
        //         })
        //     }
        //     // @ts-ignore
        //     superProto.afterSet && super.afterSet.call(this, field, value, silent, fromRelationUpdate, beforeResult, wasSet)
        // }
    }

    return ChronoPartOfProjectModelMixin
}){}

