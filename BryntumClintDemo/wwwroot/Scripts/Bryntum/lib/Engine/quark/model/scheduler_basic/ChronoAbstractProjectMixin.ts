import { CommitResult } from "../../../../ChronoGraph/chrono/Graph.js"
import { Transaction } from "../../../../ChronoGraph/chrono/Transaction.js"
import { AnyConstructor, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js"
import { ChronoModelMixin } from "../../../chrono/ChronoModelMixin.js"
import { ConflictEffect, ConflictResolutionResult } from "../../../chrono/Conflict.js"
import { EngineReplica } from "../../../chrono/Replica.js"
import { ChronoStoreMixin } from "../../store/mixin/ChronoStoreMixin.js"
import { AbstractProjectMixin } from "../AbstractProjectMixin.js"


/**
 * This is an abstract project, which just lists the available stores.
 *
 * The actual project classes are [[SchedulerBasicProjectMixin]], [[SchedulerProProjectMixin]], [[GanttProjectMixin]].
 */
export class ChronoAbstractProjectMixin extends Mixin(
    [ ChronoModelMixin, AbstractProjectMixin ],
    (base : AnyConstructor<ChronoModelMixin & AbstractProjectMixin , typeof ChronoModelMixin & typeof AbstractProjectMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class ChronoAbstractProjectMixin extends base {

        /**
         * The [[Replica]] instance containing all data for this project.
         */
        replica                   : EngineReplica

        eventModelClass           : typeof ChronoModelMixin

        dependencyModelClass      : typeof ChronoModelMixin

        resourceModelClass        : typeof ChronoModelMixin

        assignmentModelClass      : typeof ChronoModelMixin

        calendarModelClass        : typeof ChronoModelMixin

        eventStoreClass           : typeof ChronoStoreMixin

        dependencyStoreClass      : typeof ChronoStoreMixin

        resourceStoreClass        : typeof ChronoStoreMixin

        assignmentStoreClass      : typeof ChronoStoreMixin

        calendarManagerStoreClass : typeof ChronoStoreMixin

        eventStore                : ChronoStoreMixin

        dependencyStore           : ChronoStoreMixin

        resourceStore             : ChronoStoreMixin

        assignmentStore           : ChronoStoreMixin

        calendarManagerStore      : ChronoStoreMixin


        getGraph () : EngineReplica {
            return this.replica
        }


        beforeCommitAsync () : Promise<CommitResult> { return null }


        async commitAsync () : Promise<CommitResult> {
            return this.replica.commitAsync()
        }


        async onSchedulingConflict (conflict : ConflictEffect, transaction : Transaction) : Promise<ConflictResolutionResult> {
            // is there is a "schedulingConflict" event listener we expect resolution option will be picked there
            if (this.hasListener('schedulingConflict')) {
                return new Promise((resolve, reject) => {
                    this.trigger('schedulingConflict', {
                        continueWithResolutionResult    : resolve,
                        conflict
                    })
                })
            }

            // by default we cancel the committed changes
            return ConflictResolutionResult.Cancel
        }
    }

    return ChronoAbstractProjectMixin
}){}
