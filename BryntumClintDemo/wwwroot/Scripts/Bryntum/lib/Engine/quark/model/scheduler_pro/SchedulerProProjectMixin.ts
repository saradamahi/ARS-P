import { ProposedOrPrevious } from "../../../../ChronoGraph/chrono/Effect.js"
import { AnyConstructor, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js"
import { CI } from "../../../../ChronoGraph/collection/Iterator.js"
import { CalculationIterator } from "../../../../ChronoGraph/primitives/Calculation.js"
import { model_field } from "../../../chrono/ModelFieldAtom.js"
import { DependenciesCalendar, DependencyValidationResult, DependencyType, Direction, ProjectType } from "../../../scheduling/Types.js"
import { ChronoDependencyStoreMixin } from "../../store/ChronoDependencyStoreMixin.js"
import { ChronoEventStoreMixin } from "../../store/ChronoEventStoreMixin.js"
import { HasDependenciesMixin } from "../scheduler_basic/HasDependenciesMixin.js"
import { SchedulerBasicProjectMixin } from "../scheduler_basic/SchedulerBasicProjectMixin.js"
import { ConstrainedEarlyEventMixin } from "./ConstrainedEarlyEventMixin.js"
import { SchedulerProDependencyMixin } from "./SchedulerProDependencyMixin.js"
import { SchedulerProEvent } from "./SchedulerProEvent.js"
import { SchedulerProAssignmentMixin } from "./SchedulerProAssignmentMixin.js"
import { SchedulerProResourceMixin } from "./SchedulerProResourceMixin.js"
import { BaseDependencyMixin } from "../scheduler_basic/BaseDependencyMixin.js"


//---------------------------------------------------------------------------------------------------------------------
/**
 * Scheduler Pro project mixin type. At this level, events are scheduled according to the incoming dependencies
 * and calendars of the assigned resources.
 *
 * The base event class for this level is [[SchedulerProEvent]]. The base dependency class is [[SchedulerProDependencyMixin]]
 */
export class SchedulerProProjectMixin extends Mixin(
    [ SchedulerBasicProjectMixin, ConstrainedEarlyEventMixin ],
    (base : AnyConstructor<SchedulerBasicProjectMixin & ConstrainedEarlyEventMixin, typeof SchedulerBasicProjectMixin & typeof ConstrainedEarlyEventMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class SchedulerProProjectMixin extends base {

        eventModelClass             : typeof SchedulerProEvent
        dependencyModelClass        : typeof SchedulerProDependencyMixin
        assignmentModelClass        : typeof SchedulerProAssignmentMixin
        resourceModelClass          : typeof SchedulerProResourceMixin

        eventStore                  : ChronoEventStoreMixin & { project : { eventModelClass : typeof SchedulerProEvent } }
        dependencyStore             : ChronoDependencyStoreMixin & { project : { dependencyModelClass : typeof SchedulerProDependencyMixin } }

        /**
         * The source of the calendar for dependencies.
         */
        @model_field({ type : 'string', defaultValue : DependenciesCalendar.ToEvent })
        dependenciesCalendar      : DependenciesCalendar


        /**
         * Whether the auto percent done calculation for parent events should be enabled.
         */
        @model_field({ type : 'boolean', defaultValue : true })
        autoCalculatePercentDoneForParentTasks      : boolean


        * calculateDirection () : CalculationIterator<Direction> {
            return yield ProposedOrPrevious
        }


        getType () : ProjectType {
            return ProjectType.SchedulerPro
        }


        getDefaultEventModelClass () : this[ 'eventModelClass' ] {
            return SchedulerProEvent
        }


        getDefaultDependencyModelClass () : this[ 'dependencyModelClass' ] {
            return SchedulerProDependencyMixin
        }


        getDefaultAssignmentModelClass () : this[ 'assignmentModelClass' ] {
            return SchedulerProAssignmentMixin
        }


        getDefaultResourceModelClass () : this[ 'resourceModelClass' ] {
            return SchedulerProResourceMixin
        }


        /**
         * Validates a hypothetical dependency with provided parameters.
         *
         * ```ts
         * // let's check if a EndToStart dependency linking event1 with event2 will be valid
         * const validationResult = await project.validateDependency(event1, event2, DependencyType.EndToStart);
         *
         * switch (validationResult) {
         *     const DependencyValidationResult.CyclicDependency :
         *         console.log('Dependency builds a cycle');
         *         break;
         *
         *     const DependencyValidationResult.DuplicatingDependency :
         *         console.log('Such dependency already exists');
         *         break;
         *
         *     const DependencyValidationResult.NoError :
         *         console.log('Dependency is valid');
         * }
         * ```
         *
         * See also [[isValidDependency]] method for more basic usage.
         *
         * @param fromEvent The dependency predecessor
         * @param toEvent The dependency successor
         * @param type The dependency type
         * @param ignoreDependency Dependencies to ignore while validating. This parameter can be used for example if one plans to change
         * an existing dependency properties and wants to know if the change will lead to an error:
         *
         * ```ts
         * // let's check if changing of the dependency predecessor to newPredecessor will make it invalid
         * const validationResult = await project.validateDependency(newPredecessor, dependency.toEvent, dependency.type, dependency);
         *
         * if (validationResult !== DependencyValidationResult.NoError) console.log("The dependency is invalid");
         * ```
         * @return The validation result
         */
        async validateDependency (fromEvent : HasDependenciesMixin, toEvent : HasDependenciesMixin, type : DependencyType, ignoreDependency? : BaseDependencyMixin | BaseDependencyMixin[]) : Promise<DependencyValidationResult> {
            let ingoredDependencies : BaseDependencyMixin[]

            if (ignoreDependency) {
                ingoredDependencies = Array.isArray(ignoreDependency) ? ignoreDependency : [ignoreDependency]
            }

            const alreadyLinked = CI(fromEvent.outgoingDeps).some((dependency) => dependency.toEvent === toEvent && !ingoredDependencies?.includes(dependency))

            if (alreadyLinked) return DependencyValidationResult.DuplicatingDependency

            if (await this.isDependencyCyclic(fromEvent, toEvent, type, ingoredDependencies)) {
                return DependencyValidationResult.CyclicDependency
            }

            return DependencyValidationResult.NoError
        }


        /**
         * Validates a hypothetical dependency with provided parameters.
         *
         * ```ts
         * // let's check if a EndToStart dependency linking event1 with event2 will be valid
         * if (await project.isValidDependency(event1, event2, DependencyType.EndToStart)) {
         *     console.log('Dependency is valid');
         * } else {
         *     console.log('Dependency is invalid');
         * }
         * ```
         *
         * See also [[validateDependency]] method for more detailed validation results.
         *
         * @param fromEvent The dependency predecessor
         * @param toEvent The dependency successor
         * @param type The dependency type
         * @param ignoreDependency Dependencies to ignore while validating. This parameter can be used for example if one plans to change
         * an existing dependency properties and wants to know if the change will lead to an error:
         *
         * ```ts
         * // let's check if changing of the dependency predecessor to newPredecessor will make it invalid
         * if (await project.isValidDependency(newPredecessor, dependency.toEvent, dependency.type, dependency)) console.log("The dependency is valid");
         * ```
         * @return The validation result
         */
        // this does not account for possible scheduling conflicts
        async isValidDependency (fromEvent : HasDependenciesMixin, toEvent : HasDependenciesMixin, type : DependencyType, ignoreDependency? : BaseDependencyMixin | BaseDependencyMixin[]) : Promise<boolean> {
            const validationResult = await this.validateDependency(fromEvent, toEvent, type, ignoreDependency)

            return validationResult === DependencyValidationResult.NoError
        }


        async isDependencyCyclic (fromEvent : HasDependenciesMixin, toEvent : HasDependenciesMixin, type : DependencyType, ignoreDependency? : BaseDependencyMixin | BaseDependencyMixin[]) : Promise<boolean> {
            const dependencyClass   = this.getDependencyStore().modelClass

            const dependency        = new dependencyClass({ fromEvent, toEvent, type })

            const branch            = this.replica.branch({ autoCommit : false, onComputationCycle : 'throw' })

            if (ignoreDependency) {
                if (!Array.isArray(ignoreDependency)) {
                    ignoreDependency = [ignoreDependency]
                }

                ignoreDependency.forEach(dependency => branch.removeEntity(dependency))
            }

            branch.addEntity(dependency)

            dependency.project      = this

            try {
                // @ts-ignore
                await branch.readAsync(toEvent.$.earlyStartDateConstraintIntervals)
                // @ts-ignore
                await branch.readAsync(toEvent.$.earlyEndDateConstraintIntervals)

                return false
            } catch (e) {
                // return true for the cycle exception and re-throw all others
                if (/cycle/i.test(e)) return true

                throw e
            }
        }

        // work in progress
        // This method validates changes (e.g. type) for existing dependencies (which are already in the store)
        async isValidDependencyModel (dependency : SchedulerProDependencyMixin, ignoreDependencies : BaseDependencyMixin | BaseDependencyMixin[]) {
            return this.isValidDependency(dependency.fromEvent, dependency.toEvent, dependency.type, ignoreDependencies)
        }

    }

    return SchedulerProProjectMixin
}){}
