var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { MixinAny } from "../../../../ChronoGraph/class/BetterMixin.js";
import { ReadMode, Replica } from "../../../../ChronoGraph/replica/Replica.js";
import { Schema } from "../../../../ChronoGraph/schema/Schema.js";
import { delay } from "../../../../ChronoGraph/util/Helpers.js";
import StateTrackingManager from "../../../../Core/data/stm/StateTrackingManager.js";
import Store from "../../../../Core/data/Store.js";
import { model_field, ModelReferenceField } from "../../../chrono/ModelFieldAtom.js";
import { EngineReplica } from "../../../chrono/Replica.js";
import { DurationConverterMixin } from "../../../scheduling/DurationConverterMixin.js";
import { ProjectType } from "../../../scheduling/Types.js";
import { ChronoAssignmentStoreMixin } from "../../store/ChronoAssignmentStoreMixin.js";
import { ChronoCalendarManagerStoreMixin } from "../../store/ChronoCalendarManagerStoreMixin.js";
import { ChronoDependencyStoreMixin } from "../../store/ChronoDependencyStoreMixin.js";
import { ChronoEventStoreMixin } from "../../store/ChronoEventStoreMixin.js";
import { ChronoResourceStoreMixin } from "../../store/ChronoResourceStoreMixin.js";
import { ChronoAbstractProjectMixin } from "./ChronoAbstractProjectMixin.js";
import { BaseAssignmentMixin } from "./BaseAssignmentMixin.js";
import { BaseCalendarMixin } from "./BaseCalendarMixin.js";
import { BaseDependencyMixin } from "./BaseDependencyMixin.js";
import { BaseEventMixin } from "./BaseEventMixin.js";
import { BaseResourceMixin } from "./BaseResourceMixin.js";
import { CanCombineCalendarsMixin, HasCalendarMixin } from "./HasCalendarMixin.js";
import { HasSubEventsMixin } from "./HasSubEventsMixin.js";
import { SchedulerBasicEvent } from "./SchedulerBasicEvent.js";
import BrowserHelper from "../../../../Core/helper/BrowserHelper.js";
import ObjectHelper from "../../../../Core/helper/ObjectHelper.js";
export class SchedulerBasicProjectMixin extends MixinAny([
    ChronoAbstractProjectMixin,
    BaseEventMixin,
    HasSubEventsMixin,
    HasCalendarMixin,
    DurationConverterMixin,
    CanCombineCalendarsMixin
], (base) => {
    const superProto = base.prototype;
    class SchedulerBasicProjectMixin extends base {
        construct(config = {}) {
            this.enableProgressNotifications = config.enableProgressNotifications;
            if (!('expanded' in config)) {
                config.expanded = true;
            }
            superProto.construct.call(this, config);
            this.ignoreInitialCommitComputationCycles = ('ignoreInitialCommitComputationCycles' in config) ? config.ignoreInitialCommitComputationCycles : true;
            if (!this.eventModelClass)
                this.eventModelClass = this.getDefaultEventModelClass();
            if (!this.eventStoreClass)
                this.eventStoreClass = this.getDefaultEventStoreClass();
            if (!this.dependencyModelClass)
                this.dependencyModelClass = this.getDefaultDependencyModelClass();
            if (!this.dependencyStoreClass)
                this.dependencyStoreClass = this.getDefaultDependencyStoreClass();
            if (!this.resourceModelClass)
                this.resourceModelClass = this.getDefaultResourceModelClass();
            if (!this.resourceStoreClass)
                this.resourceStoreClass = this.getDefaultResourceStoreClass();
            if (!this.assignmentModelClass)
                this.assignmentModelClass = this.getDefaultAssignmentModelClass();
            if (!this.assignmentStoreClass)
                this.assignmentStoreClass = this.getDefaultAssignmentStoreClass();
            if (!this.calendarModelClass)
                this.calendarModelClass = this.getDefaultCalendarModelClass();
            if (!this.calendarManagerStoreClass)
                this.calendarManagerStoreClass = this.getDefaultCalendarManagerStoreClass();
            this.replica = this.createReplica();
            this.replica.addEntity(this);
            this.defaultCalendar = new this.calendarModelClass({
                unspecifiedTimeIsWorking: this.unspecifiedTimeIsWorking
            });
            this.defaultCalendar.project = this;
            this.replica.addEntity(this.defaultCalendar);
            const stm = this.stm = new StateTrackingManager(ObjectHelper.assign({
                disabled: true
            }, this.stm));
            this.stm.on({
                restoringStop: async () => {
                    this.stm.disable();
                    await this.commitAsync();
                    if (!this.isDestroyed) {
                        this.stm.enable();
                        this.trigger('stateRestoringDone');
                    }
                }
            });
            let reEnableAutoRecord;
            this.on({
                beforeCommit() {
                    if (stm.isRecording && stm.autoRecord) {
                        reEnableAutoRecord = true;
                        stm.autoRecord = false;
                    }
                },
                dataReady() {
                    if (reEnableAutoRecord) {
                        stm.autoRecord = true;
                        reEnableAutoRecord = false;
                    }
                }
            });
            this.setCalendarManagerStore(this.calendarManagerStore);
            this.setEventStore(this.eventStore);
            this.setDependencyStore(this.dependencyStore);
            this.setResourceStore(this.resourceStore);
            this.setAssignmentStore(this.assignmentStore);
            const hasInlineData = Boolean(this.calendarsData || this.eventsData || this.dependenciesData || this.resourcesData || this.assignmentsData);
            if (hasInlineData) {
                this.loadInlineData({
                    calendarsData: this.calendarsData,
                    eventsData: this.eventsData,
                    dependenciesData: this.dependenciesData,
                    resourcesData: this.resourcesData,
                    assignmentsData: this.assignmentsData
                });
                delete this.calendarsData;
                delete this.eventsData;
                delete this.dependenciesData;
                delete this.resourcesData;
                delete this.assignmentsData;
            }
        }
        doDestroy() {
            var _a, _b, _c, _d, _e, _f;
            const me = this;
            (_a = me.eventStore) === null || _a === void 0 ? void 0 : _a.destroy();
            (_b = me.dependencyStore) === null || _b === void 0 ? void 0 : _b.destroy();
            (_c = me.assignmentStore) === null || _c === void 0 ? void 0 : _c.destroy();
            (_d = me.resourceStore) === null || _d === void 0 ? void 0 : _d.destroy();
            (_e = me.calendarManagerStore) === null || _e === void 0 ? void 0 : _e.destroy();
            me.replica.clear();
            (_f = me.stm) === null || _f === void 0 ? void 0 : _f.destroy();
            superProto.doDestroy.call(this);
        }
        createReplica() {
            return EngineReplica.mix(Replica).new({
                project: this,
                schema: Schema.new(),
                enableProgressNotifications: this.enableProgressNotifications,
                silenceInitialCommit: this.silenceInitialCommit,
                ignoreInitialCommitComputationCycles: this.ignoreInitialCommitComputationCycles,
                onWriteDuringCommit: 'ignore',
                readMode: ReadMode.CurrentOrProposedOrPrevious
            });
        }
        *hasSubEvents() {
            return this.getEventStore().count > 0;
        }
        *subEventsIterable() {
            return this.getEventStore().getRange();
        }
        getType() {
            return ProjectType.SchedulerBasic;
        }
        get enableProgressNotifications() {
            return this._enableProgressNotifications;
        }
        set enableProgressNotifications(value) {
            this._enableProgressNotifications = value;
            if (this.replica)
                this.replica.enableProgressNotifications = value;
        }
        getDefaultEventModelClass() {
            return SchedulerBasicEvent;
        }
        getDefaultEventStoreClass() {
            return ChronoEventStoreMixin;
        }
        getDefaultDependencyModelClass() {
            return BaseDependencyMixin;
        }
        getDefaultDependencyStoreClass() {
            return ChronoDependencyStoreMixin;
        }
        getDefaultResourceModelClass() {
            return BaseResourceMixin;
        }
        getDefaultResourceStoreClass() {
            return ChronoResourceStoreMixin;
        }
        getDefaultAssignmentModelClass() {
            return BaseAssignmentMixin;
        }
        getDefaultAssignmentStoreClass() {
            return ChronoAssignmentStoreMixin;
        }
        getDefaultCalendarModelClass() {
            return BaseCalendarMixin;
        }
        getDefaultCalendarManagerStoreClass() {
            return ChronoCalendarManagerStoreMixin;
        }
        async loadInlineData(data) {
            const { calendarManagerStore, eventStore, dependencyStore, assignmentStore, resourceStore } = this;
            this.replica.unScheduleAutoCommit();
            if (this.replica.enableProgressNotifications) {
                await delay(0);
                this.replica.onPropagationProgressNotification({ total: 0, remaining: 0, phase: 'storePopulation' });
                await delay(50);
            }
            this.isLoadingInlineData = true;
            if (BrowserHelper.global.DEBUG) {
                console.log(`%cInitializing project`, 'font-weight:bold;color:darkgreen;text-transform:uppercase;margin-top: 2em');
                console.time('Time to visible');
                console.time('Populating project');
            }
            if (data.calendarsData) {
                this.repopulateStore(calendarManagerStore);
                calendarManagerStore.data = data.calendarsData;
            }
            if (data.eventsData || data.tasksData) {
                this.repopulateStore(eventStore);
                eventStore.data = data.eventsData || data.tasksData;
            }
            if (data.dependenciesData) {
                this.repopulateStore(dependencyStore);
                dependencyStore.data = data.dependenciesData;
            }
            if (data.resourcesData) {
                this.repopulateStore(resourceStore);
                resourceStore.data = data.resourcesData;
            }
            if (data.assignmentsData) {
                this.repopulateStore(assignmentStore);
                assignmentStore.data = data.assignmentsData;
            }
            if (BrowserHelper.global.DEBUG)
                console.timeEnd('Populating project');
            await this.commitLoad();
            this.isLoadingInlineData = false;
            return;
        }
        async commitLoad() {
            await this.commitAsync();
            if (!this.isDestroyed)
                this.trigger('load');
        }
        get isRepopulatingStores() {
            var _a;
            return Boolean((_a = this.repopulateStores) === null || _a === void 0 ? void 0 : _a.size);
        }
        repopulateStore(store) {
            if (this.repopulateOnDataset && store.count) {
                if (!this.repopulateStores)
                    this.repopulateStores = new Set();
                this.repopulateStores.add(store);
                this.repopulateReplica();
            }
        }
        repopulateReplica() {
            const { calendarManagerStore, eventStore, dependencyStore, assignmentStore, resourceStore, replica: oldReplica } = this;
            this.unlinkStoreRecords(calendarManagerStore, eventStore, dependencyStore, resourceStore, assignmentStore);
            this.unlinkRecord(this);
            this.unlinkRecord(this.defaultCalendar);
            oldReplica.clear();
            const replica = this.replica = this.createReplica();
            replica.addEntity(this);
            replica.addEntity(this.defaultCalendar);
            this.joinStoreRecords(calendarManagerStore, true);
            this.joinStoreRecords(eventStore, true);
            this.joinStoreRecords(dependencyStore, true);
            this.joinStoreRecords(resourceStore, true);
            this.joinStoreRecords(assignmentStore, true);
            this.repopulateStores.clear();
        }
        beforeCommitAsync() {
            if (this.repopulateReplica.isPending) {
                this.repopulateReplica.now();
                return this.replica.commitAsync();
            }
            return null;
        }
        unlinkRecord(record) {
            var _a;
            const { activeTransaction } = this.replica;
            const { $ } = record;
            const keys = Object.keys($);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const identifier = $[key];
                if (identifier.field instanceof ModelReferenceField) {
                    const value = record[key];
                    identifier.DATA = (_a = value === null || value === void 0 ? void 0 : value.id) !== null && _a !== void 0 ? _a : value;
                }
                else {
                    const entry = activeTransaction.getLatestStableEntryFor(identifier);
                    if (entry)
                        identifier.DATA = entry.getValue();
                }
            }
            record.graph = null;
        }
        unlinkStoreRecords(...stores) {
            stores.forEach(store => store.traverse((record) => {
                if (!this.repopulateStores.has(store)) {
                    this.unlinkRecord(record);
                }
            }, false, false, true));
        }
        getGraph() {
            return this.replica;
        }
        async addEvents(events) {
            this.eventStore.add(events);
            return this.graph.commitAsync();
        }
        async addEvent(event) {
            this.eventStore.add(event);
            return this.graph.commitAsync();
        }
        includeEvent(event) {
            this.eventStore.add(event);
        }
        async removeEvents(events) {
            this.eventStore.remove(events);
            return this.graph.commitAsync();
        }
        excludeEvent(event) {
            this.eventStore.remove(event);
        }
        async removeEvent(event) {
            this.eventStore.remove(event);
            return this.graph.commitAsync();
        }
        getStm() {
            return this.stm;
        }
        calculateProject() {
            return this;
        }
        resolveCalendar(locator) {
            return super.resolveCalendar(locator) || this.defaultCalendar;
        }
        joinStoreRecords(store, skipRoot = false) {
            const fn = (record) => {
                record.setProject(this);
                record.joinProject();
            };
            if (store.rootNode) {
                store.rootNode.traverse(fn, skipRoot, true);
            }
            else {
                store.forEach(fn, null, true);
            }
        }
        unJoinStoreRecords(store) {
            const fn = (record) => {
                record.leaveProject();
                record.setProject(this);
            };
            if (store.rootNode) {
                store.rootNode.traverse(node => {
                    if (node !== store.rootNode)
                        fn(node);
                }, false, true);
            }
            else {
                store.forEach(fn, null, true);
            }
        }
        setEventStore(store) {
            const oldEventStore = this.eventStore;
            if (oldEventStore && this.stm.hasStore(oldEventStore)) {
                this.stm.removeStore(oldEventStore);
                this.unJoinStoreRecords(oldEventStore);
                const assignmentsForRemoval = oldEventStore.assignmentsForRemoval;
                assignmentsForRemoval.forEach(assignment => {
                    const oldEvent = assignment.event;
                    if (oldEvent) {
                        const newEvent = store.getById(oldEvent.id);
                        if (newEvent) {
                            assignment.event = newEvent;
                            assignmentsForRemoval.delete(assignment);
                        }
                    }
                });
                oldEventStore.afterEventRemoval();
            }
            if (!store || !(store instanceof Store)) {
                const storeClass = (store === null || store === void 0 ? void 0 : store.storeClass) || this.eventStoreClass;
                this.eventStore = new storeClass(ObjectHelper.assign({
                    modelClass: this.eventModelClass,
                    project: this,
                    stm: this.stm
                }, store || {}));
            }
            else {
                this.eventStore = store;
                store.setProject(this);
                this.stm.addStore(store);
                if (store.tree && store.rootNode !== this) {
                    this.appendChild(store.rootNode.children || []);
                    store.rootNode = this;
                }
                else {
                    this.joinStoreRecords(store);
                }
            }
            this.trigger('eventStoreChange', { store: this.eventStore });
        }
        setDependencyStore(store) {
            const oldDependencyStore = this.dependencyStore;
            if (oldDependencyStore && this.stm.hasStore(oldDependencyStore)) {
                this.stm.removeStore(oldDependencyStore);
            }
            if (!store || !(store instanceof Store)) {
                const storeClass = (store === null || store === void 0 ? void 0 : store.storeClass) || this.dependencyStoreClass;
                this.dependencyStore = new storeClass(ObjectHelper.assign({
                    modelClass: this.dependencyModelClass,
                    project: this,
                    stm: this.stm
                }, store || {}));
            }
            else {
                this.dependencyStore = store;
                store.setProject(this);
                this.stm.addStore(store);
                this.joinStoreRecords(store);
            }
            this.trigger('dependencyStoreChange', { store: this.dependencyStore });
        }
        setResourceStore(store) {
            const oldResourceStore = this.resourceStore;
            if (oldResourceStore && this.stm.hasStore(oldResourceStore)) {
                this.stm.removeStore(oldResourceStore);
                this.unJoinStoreRecords(oldResourceStore);
                const assignmentsForRemoval = oldResourceStore.assignmentsForRemoval;
                assignmentsForRemoval.forEach(assignment => {
                    const oldResource = assignment.resource;
                    if (oldResource) {
                        const newResource = store.getById(oldResource.id);
                        if (newResource) {
                            assignment.resource = newResource;
                            assignmentsForRemoval.delete(assignment);
                        }
                    }
                });
                oldResourceStore.afterResourceRemoval();
            }
            if (!store || !(store instanceof Store)) {
                const storeClass = (store === null || store === void 0 ? void 0 : store.storeClass) || this.resourceStoreClass;
                this.resourceStore = new storeClass(ObjectHelper.assign({
                    modelClass: this.resourceModelClass,
                    project: this,
                    stm: this.stm
                }, store || {}));
            }
            else {
                this.resourceStore = store;
                store.setProject(this);
                this.stm.addStore(store);
                this.joinStoreRecords(store);
            }
            this.trigger('resourceStoreChange', { store: this.resourceStore });
        }
        setAssignmentStore(store) {
            const oldAssignmentStore = this.assignmentStore;
            if (oldAssignmentStore && this.stm.hasStore(oldAssignmentStore)) {
                this.stm.removeStore(oldAssignmentStore);
                this.unJoinStoreRecords(oldAssignmentStore);
            }
            if (!store || !(store instanceof Store)) {
                const storeClass = (store === null || store === void 0 ? void 0 : store.storeClass) || this.assignmentStoreClass;
                this.assignmentStore = new storeClass(ObjectHelper.assign({
                    modelClass: this.assignmentModelClass,
                    project: this,
                    stm: this.stm
                }, store || {}));
            }
            else {
                this.assignmentStore = store;
                store.setProject(this);
                this.stm.addStore(store);
                this.joinStoreRecords(store);
            }
            this.trigger('assignmentStoreChange', { store: this.assignmentStore });
        }
        setCalendarManagerStore(store) {
            const oldCalendarManagerStore = this.calendarManagerStore;
            if (oldCalendarManagerStore && this.stm.hasStore(oldCalendarManagerStore)) {
                this.stm.removeStore(oldCalendarManagerStore);
            }
            if (!store || !(store instanceof Store)) {
                const storeClass = (store === null || store === void 0 ? void 0 : store.storeClass) || this.calendarManagerStoreClass;
                this.calendarManagerStore = new storeClass(ObjectHelper.assign({
                    modelClass: this.calendarModelClass,
                    project: this,
                    stm: this.stm
                }, store || {}));
            }
            else {
                this.calendarManagerStore = store;
                if (store) {
                    store.setProject(this);
                    this.stm.addStore(store);
                    this.joinStoreRecords(store);
                }
            }
            this.trigger('calendarManagerStoreChange', { store: this.calendarManagerStore });
        }
        async isValidDependency(...args) {
            return true;
        }
        async tryPropagateWithChanges(changerFn) {
            const stm = this.stm;
            let stmInitiallyDisabled, stmInitiallyAutoRecord;
            const captureStm = () => {
                stmInitiallyDisabled = stm.disabled;
                stmInitiallyAutoRecord = stm.autoRecord;
                if (stmInitiallyDisabled) {
                    stm.enable();
                }
                else {
                    if (stmInitiallyAutoRecord) {
                        stm.autoRecord = false;
                    }
                    if (stm.isRecording) {
                        stm.stopTransaction();
                    }
                }
            };
            const commitStmTransaction = () => {
                stm.stopTransaction();
                if (stmInitiallyDisabled) {
                    stm.resetQueue();
                }
            };
            const rejectStmTransaction = () => {
                if (stm.transaction.length) {
                    stm.forEachStore(s => s.beginBatch());
                    stm.rejectTransaction();
                    stm.forEachStore(s => s.endBatch());
                }
                else {
                    stm.stopTransaction();
                }
            };
            const freeStm = () => {
                stm.disabled = stmInitiallyDisabled;
                stm.autoRecord = stmInitiallyAutoRecord;
            };
            captureStm();
            stm.startTransaction();
            changerFn();
            let result = true;
            try {
                const commitResult = await this.commitAsync();
                result = !commitResult.rejectedWith;
            }
            catch (e) {
                if (!/cycle/i.test(e))
                    throw e;
                result = false;
            }
            if (result) {
                commitStmTransaction();
            }
            else {
                this.replica.reject();
                rejectStmTransaction();
            }
            freeStm();
            return result;
        }
        isEngineReady() {
            const { replica } = this;
            return !(replica.dirty && (replica.hasPendingAutoCommit() || replica.isCommitting || this.isRepopulatingStores));
        }
        static get defaultConfig() {
            return {
                assignmentsData: null,
                calendarsData: null,
                dependenciesData: null,
                eventsData: null,
                resourcesData: null,
                eventStore: null,
                resourceStore: null,
                assignmentStore: null,
                dependencyStore: null,
                calendarManagerStore: null,
                eventModelClass: null,
                resourceModelClass: null,
                assignmentModelClass: null,
                dependencyModelClass: null,
                calendarModelClass: null,
                repopulateOnDataset: true
            };
        }
        static get delayable() {
            return {
                repopulateReplica: 10
            };
        }
    }
    SchedulerBasicProjectMixin.applyConfigs = true;
    __decorate([
        model_field({ type: 'boolean', defaultValue: true })
    ], SchedulerBasicProjectMixin.prototype, "unspecifiedTimeIsWorking", void 0);
    return SchedulerBasicProjectMixin;
}) {
}
