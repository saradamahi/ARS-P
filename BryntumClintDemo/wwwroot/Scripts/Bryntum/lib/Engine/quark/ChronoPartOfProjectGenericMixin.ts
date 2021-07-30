import { ChronoGraph } from "../../ChronoGraph/chrono/Graph.js"
import { AnyConstructor, Mixin } from "../../ChronoGraph/class/BetterMixin.js"
import { ChronoAbstractProjectMixin } from "./model/scheduler_basic/ChronoAbstractProjectMixin.js"
import { ModelId } from "./Types.js"
import { AbstractPartOfProjectGenericMixin } from "./AbstractPartOfProjectGenericMixin.js"

/**
 * This a base generic mixin for every class, that belongs to a chronograph powered project.
 *
 * It just provides getter/setter for the `project` property, along with some convenience methods
 * to access the project's stores.
 */
export class ChronoPartOfProjectGenericMixin extends Mixin(
    [AbstractPartOfProjectGenericMixin],
    (base : AnyConstructor<AbstractPartOfProjectGenericMixin, typeof AbstractPartOfProjectGenericMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class ChronoPartOfProjectGenericMixin extends base {

        /**
         * The [[AbstractProjectMixin|project]] instance, this entity belongs to.
         */
        project             : ChronoAbstractProjectMixin


        /**
         * The method to get the `ChronoGraph` instance, this entity belongs to.
         */
        getGraph () : ChronoGraph {
            const project       = this.getProject()

            return project?.getGraph()
        }


        //region Entity getters

        /**
         * Convenience method to get the instance of event by its id.
         */
        getEventById (id : ModelId) : this[ 'project' ][ 'eventStore' ][ 'modelInstanceT' ] {
            return this.getEventStore()?.getById(id)
        }


        /**
         * Convenience method to get the instance of dependency by its id.
         */
        getDependencyById (id : ModelId) : this[ 'project' ][ 'dependencyStore' ][ 'modelInstanceT' ] {
            return this.getDependencyStore()?.getById(id)
        }


        /**
         * Convenience method to get the instance of resource by its id.
         */
        getResourceById (id : ModelId) : this[ 'project' ][ 'resourceStore' ][ 'modelInstanceT' ] {
            return this.getResourceStore()?.getById(id)
        }


        /**
         * Convenience method to get the instance of assignment by its id.
         */
        getAssignmentById (id : ModelId) : this[ 'project' ][ 'assignmentStore' ][ 'modelInstanceT' ] {
            return this.getAssignmentStore()?.getById(id)
        }


        /**
         * Convenience method to get the instance of calendar by its id.
         */
        getCalendarById (id : ModelId) : this[ 'project' ][ 'calendarManagerStore' ][ 'modelInstanceT' ] {
            return this.getCalendarManagerStore()?.getById(id)
        }

        //endregion
    }

    return ChronoPartOfProjectGenericMixin
}){}

