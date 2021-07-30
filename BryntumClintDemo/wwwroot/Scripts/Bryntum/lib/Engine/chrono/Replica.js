import { RejectSymbol } from "../../ChronoGraph/chrono/Effect.js";
import { TombStone } from "../../ChronoGraph/chrono/Quark.js";
import { Revision } from "../../ChronoGraph/chrono/Revision.js";
import { Transaction } from "../../ChronoGraph/chrono/Transaction.js";
import { Mixin } from "../../ChronoGraph/class/BetterMixin.js";
import { Replica } from "../../ChronoGraph/replica/Replica.js";
import { ConflictSymbol } from "./Conflict.js";
import { ModelBucketField, IsChronoModelSymbol } from "./ModelFieldAtom.js";
import BrowserHelper from "../../Core/helper/BrowserHelper.js";
export class EngineRevision extends Revision {
    constructor() {
        super(...arguments);
        this.failedResolutionReferences = new Map();
    }
}
export class EngineTransaction extends Transaction {
    constructor() {
        super(...arguments);
        this.candidateClass = EngineRevision;
    }
    initialize(...args) {
        super.initialize(...args);
        this.candidate.failedResolutionReferences = new Map(this.baseRevision.failedResolutionReferences);
    }
    addIdentifier(identifier, proposedValue, ...args) {
        this.markFailedResolutionReferences();
        return super.addIdentifier(identifier, proposedValue, ...args);
    }
    markFailedResolutionReferences() {
        this.candidate.failedResolutionReferences.forEach((failedResolutionValue, identifier) => {
            this.write(identifier, failedResolutionValue);
        });
        this.candidate.failedResolutionReferences.clear();
    }
}
export class EngineReplica extends Mixin([Replica], (base) => {
    const superProto = base.prototype;
    class EngineReplica extends base {
        constructor() {
            super(...arguments);
            this.baseRevision = EngineRevision.new();
            this.transactionClass = EngineTransaction;
            this.autoCommitMode = 'async';
            this.onComputationCycle = 'reject';
            this.silenceInitialCommit = true;
            this.ignoreInitialCommitComputationCycles = true;
        }
        onPropagationProgressNotification(notification) {
            if (this.enableProgressNotifications && this.project)
                this.project.trigger('progress', notification);
        }
        propagate(args) {
            return this.commitAsync(args);
        }
        async commitAsync(args) {
            this.project.trigger('beforeCommit');
            if (this.isInitialCommit && this.ignoreInitialCommitComputationCycles) {
                this._onComputationCycle = this._onComputationCycle || this.onComputationCycle;
                this.onComputationCycle = 'ignore';
            }
            const replacedReplicaResult = this.project.beforeCommitAsync();
            if (replacedReplicaResult)
                return replacedReplicaResult;
            return superProto.commitAsync.call(this, args);
        }
        get isInitialCommit() {
            return this.project.isInitialCommit || super.isInitialCommit;
        }
        set isInitialCommit(value) {
            super.isInitialCommit = value;
        }
        async finalizeCommitAsync(transactionResult) {
            const { project } = this;
            if (!project || project.isDestroyed)
                return;
            const { entries } = transactionResult;
            const autoCommitStores = new Set();
            if (BrowserHelper.global.DEBUG)
                console.timeEnd('Time to visible');
            const { isInitialCommit, silenceInitialCommit } = this;
            const silenceCommit = isInitialCommit && silenceInitialCommit;
            if (isInitialCommit) {
                project.isInitialCommitPerformed = true;
                if (this.ignoreInitialCommitComputationCycles)
                    this.onComputationCycle = this._onComputationCycle;
            }
            project.isWritingData = true;
            project.hasLoadedDataToCommit = false;
            project.trigger('refresh', { isInitialCommit });
            await new Promise(resolve => {
                setTimeout(() => {
                    var _a, _b;
                    if (!project.isDestroyed && !transactionResult.transaction.rejectedWith) {
                        (_a = project.suspendChangesTracking) === null || _a === void 0 ? void 0 : _a.call(project);
                        if (BrowserHelper.global.DEBUG)
                            console.time('Finalize propagation');
                        const records = new Set();
                        for (const quark of entries.values()) {
                            const identifier = quark.identifier;
                            const quarkValue = quark.getValue();
                            const { field } = identifier;
                            if (quark.isShadow() || !identifier[IsChronoModelSymbol] || quarkValue === TombStone || field instanceof ModelBucketField)
                                continue;
                            const record = identifier.self;
                            const store = record.firstStore;
                            if (!records.has(record)) {
                                record.beginBatch();
                                records.add(record);
                            }
                            if ((store === null || store === void 0 ? void 0 : store.autoCommit) && !autoCommitStores.has(store)) {
                                store.suspendAutoCommit();
                                autoCommitStores.add(store);
                            }
                            record.set(field.name, quarkValue);
                        }
                        for (const record of records) {
                            record.ignoreBag = silenceCommit;
                            record.endBatch(silenceCommit, true);
                            record.ignoreBag = false;
                        }
                        if (BrowserHelper.global.DEBUG)
                            console.timeEnd('Finalize propagation');
                        project.trigger('dataReady', { records, isInitialCommit });
                        (_b = project.resumeChangesTracking) === null || _b === void 0 ? void 0 : _b.call(project, silenceCommit);
                        autoCommitStores.forEach(store => store.resumeAutoCommit());
                        if (silenceCommit) {
                            [
                                project.eventStore,
                                project.dependencyStore,
                                project.resourceStore,
                                project.assignmentStore,
                                project.calendarManagerStore
                            ].forEach(store => store.acceptChanges());
                        }
                    }
                    project.isWritingData = false;
                    resolve();
                }, 0);
            });
        }
        async [ConflictSymbol](effect, transaction) {
            return this.project.onSchedulingConflict(effect, transaction);
        }
        [RejectSymbol](effect, transaction) {
            return super[RejectSymbol](effect, transaction);
        }
    }
    return EngineReplica;
}) {
}
