import { Mixin } from "../../../../ChronoGraph/class/BetterMixin.js";
import { ChronoModelMixin } from "../../../chrono/ChronoModelMixin.js";
import { ConflictResolutionResult } from "../../../chrono/Conflict.js";
import { AbstractProjectMixin } from "../AbstractProjectMixin.js";
export class ChronoAbstractProjectMixin extends Mixin([ChronoModelMixin, AbstractProjectMixin], (base) => {
    const superProto = base.prototype;
    class ChronoAbstractProjectMixin extends base {
        getGraph() {
            return this.replica;
        }
        beforeCommitAsync() { return null; }
        async commitAsync() {
            return this.replica.commitAsync();
        }
        async onSchedulingConflict(conflict, transaction) {
            if (this.hasListener('schedulingConflict')) {
                return new Promise((resolve, reject) => {
                    this.trigger('schedulingConflict', {
                        continueWithResolutionResult: resolve,
                        conflict
                    });
                });
            }
            return ConflictResolutionResult.Cancel;
        }
    }
    return ChronoAbstractProjectMixin;
}) {
}
