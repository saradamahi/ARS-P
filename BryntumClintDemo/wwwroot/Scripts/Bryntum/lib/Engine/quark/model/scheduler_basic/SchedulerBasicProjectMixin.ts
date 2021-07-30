import { CommitResult } from "../../../../ChronoGraph/chrono/Graph.js"
import { AnyConstructor, MixinAny } from "../../../../ChronoGraph/class/BetterMixin.js"
import { CalculationIterator } from "../../../../ChronoGraph/primitives/Calculation.js"
import { ReadMode, Replica } from "../../../../ChronoGraph/replica/Replica.js"
import { Schema } from "../../../../ChronoGraph/schema/Schema.js"
import { delay } from "../../../../ChronoGraph/util/Helpers.js"
import StateTrackingManager from "../../../../Core/data/stm/StateTrackingManager.js"
import Store from "../../../../Core/data/Store.js"
import { model_field, ModelReferenceField } from "../../../chrono/ModelFieldAtom.js"
import { EngineReplica } from "../../../chrono/Replica.js"
import { DurationConverterMixin } from "../../../scheduling/DurationConverterMixin.js"
import { ProjectType } from "../../../scheduling/Types.js"
import { ChronoAssignmentStoreMixin } from "../../store/ChronoAssignmentStoreMixin.js"
import { ChronoCalendarManagerStoreMixin } from "../../store/ChronoCalendarManagerStoreMixin.js"
import { ChronoDependencyStoreMixin } from "../../store/ChronoDependencyStoreMixin.js"
import { ChronoEventStoreMixin } from "../../store/ChronoEventStoreMixin.js"
import { ChronoPartOfProjectStoreMixin } from "../../store/mixin/ChronoPartOfProjectStoreMixin.js"
import { ChronoResourceStoreMixin } from "../../store/ChronoResourceStoreMixin.js"
import { ChronoPartOfProjectModelMixin } from "../mixin/ChronoPartOfProjectModelMixin.js"
import { ChronoAbstractProjectMixin } from "./ChronoAbstractProjectMixin.js"
import { BaseAssignmentMixin } from "./BaseAssignmentMixin.js"
import { BaseCalendarMixin } from "./BaseCalendarMixin.js"
import { BaseDependencyMixin } from "./BaseDependencyMixin.js"
import { BaseEventMixin } from "./BaseEventMixin.js"
import { BaseResourceMixin } from "./BaseResourceMixin.js"
import { CanCombineCalendarsMixin, HasCalendarMixin } from "./HasCalendarMixin.js"
import { HasSubEventsMixin } from "./HasSubEventsMixin.js"
import { SchedulerBasicEvent } from "./SchedulerBasicEvent.js"
import BrowserHelper from "../../../../Core/helper/BrowserHelper.js"
import ObjectHelper from "../../../../Core/helper/ObjectHelper.js"
import { AbstractPartOfProjectStoreMixin } from "../../store/mixin/AbstractPartOfProjectStoreMixin.js"

/**
 * The data package format describing project data
 */
export type ProjectDataPackage = {
    eventsData?             : any[]
    dependenciesData?       : any[]
    resourcesData?          : any[]
    assignmentsData?        : any[]
    calendarsData?          : any[]
    tasksData?              : any[]
}


/**
 * Basic Scheduler project mixin type. At this level, events have assignments and dependencies, which both are, however,
 * only visual and do not affect the scheduling.
 */
export class SchedulerBasicProjectMixin extends MixinAny(
    [
        ChronoAbstractProjectMixin,
        BaseEventMixin,
        HasSubEventsMixin,
        HasCalendarMixin,
        DurationConverterMixin,
        CanCombineCalendarsMixin
    ],
    (base : AnyConstructor<
        ChronoAbstractProjectMixin &
        BaseEventMixin &
        HasSubEventsMixin &
        HasCalendarMixin &
        DurationConverterMixin &
        CanCombineCalendarsMixin
        ,
        typeof ChronoAbstractProjectMixin &
        typeof BaseEventMixin &
        typeof HasSubEventsMixin &
        typeof HasCalendarMixin &
        typeof DurationConverterMixin &
        typeof CanCombineCalendarsMixin
    >) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class SchedulerBasicProjectMixin extends base {

        project                     : this

        /**
         * The constructor for the "Event" entity of the project.
         */
        eventModelClass             : typeof SchedulerBasicEvent

        /**
         * The constructor for the "Dependency" entity of the project
         */
        dependencyModelClass        : typeof BaseDependencyMixin

        /**
         * The constructor for the "Resource" entity of the project
         */
        resourceModelClass          : typeof BaseResourceMixin

        /**
         * The constructor for the "Assignment" entity of the project
         */
        assignmentModelClass        : typeof BaseAssignmentMixin

        /**
         * The constructor for the "Calendar" entity of the project
         */
        calendarModelClass          : typeof BaseCalendarMixin

        /**
         * The constructor for the "Events" collection of the project
         */
        eventStoreClass             : typeof ChronoEventStoreMixin

        /**
         * The constructor for the "Dependencies" collection of the project
         */
        dependencyStoreClass        : typeof ChronoDependencyStoreMixin

        /**
         * The constructor for the "Resources" collection of the project
         */
        resourceStoreClass          : typeof ChronoResourceStoreMixin

        /**
         * The constructor for the "Assignments" collection of the project
         */
        assignmentStoreClass        : typeof ChronoAssignmentStoreMixin

        /**
         * The constructor for the "Calendars" collection of the project
         */
        calendarManagerStoreClass   : typeof ChronoCalendarManagerStoreMixin

        /**
         * State tracking manager instance the project relies on
         */
        stm                         : StateTrackingManager

        /**
         * The instance of the "Events" collection of the project
         */
        eventStore                  : ChronoEventStoreMixin

        /**
         * The instance of the "Dependencies" collection of the project
         */
        dependencyStore             : ChronoDependencyStoreMixin

        /**
         * The instance of the "Resources" collection of the project
         */
        resourceStore               : ChronoResourceStoreMixin

        /**
         * The instance of the "Assignments" collection of the project
         */
        assignmentStore             : ChronoAssignmentStoreMixin

        /**
         * The instance of the "Calendars" collection of the project
         */
        calendarManagerStore        : ChronoCalendarManagerStoreMixin

        /**
         * The events data - can be provided during project instantiation and will be loaded with [[loadInlineData]].
         *
         * ```ts
         * const project    = new SchedulerBasicProjectMixin({
         *     eventsData   : [ { name : 'Task 1' } ]
         * })
         * ```
         */
        eventsData                  : any[]
        /**
         * The dependencies data - can be provided during project instantiation and will be loaded with [[loadInlineData]].
         *
         * ```ts
         * const project    = new SchedulerBasicProjectMixin({
         *     eventsData       : [
         *         { id : 1, name : 'Predecessor' },
         *         { id : 2, name : 'Successor' }
         *     ],
         *     dependenciesData : [ { fromEvent : 1, toEvent : 2 } ]
         *     resourcesData   : [
         *         { name : 'Bulldozer' }
         *     ]
         * })
         * ```
         */
        dependenciesData            : any[]
        /**
         * The resources data - can be provided during project instantiation and will be loaded with [[loadInlineData]].
         *
         * ```ts
         * const project    = new SchedulerBasicProjectMixin({
         *     resourcesData   : [
         *         { name : 'John' },
         *         { name : 'Mary' },
         *         { name : 'Sarah' },
         *         { name : 'Robert' }
         *     ]
         * })
         * ```
         */
        resourcesData               : any[]
        /**
         * The assignments data - can be provided during project instantiation and will be loaded with [[loadInlineData]].
         *
         * ```ts
         * const project    = new SchedulerBasicProjectMixin({
         *     eventsData       : [
         *         { id : 1, name : 'Predecessor' },
         *         { id : 2, name : 'Successor' }
         *     ],
         *     assignmentsData : [
         *         { event : 1, resource : 101 },
         *         { event : 2, resource : 101 },
         *         { event : 2, resource : 102 }
         *     ]
         *     resourcesData   : [
         *         { id : 100, name : 'John' },
         *         { id : 101, name : 'Mary' },
         *         { id : 102, name : 'Gabriel' }
         *     ]
         * })
         * ```
         */
        assignmentsData             : any[]
        /**
         * The calendars data - can be provided during project instantiation and will be loaded with [[loadInlineData]].
         *
         * ```ts
         * const project    = new SchedulerBasicProjectMixin({
         *     calendar      : 1,
         *     calendarsData : [
         *         {
         *             id        : 1,
         *             name      : 'Default',
         *             intervals : [
         *                 {
         *                     recurrentStartDate : 'on Sat at 0:00',
         *                     recurrentEndDate   : 'on Mon at 0:00',
         *                     isWorking          : false
         *                 }
         *             ]
         *         }
         *     ]
         * })
         * ```
         */
        calendarsData               : any[]

        defaultCalendar             : BaseCalendarMixin

        /**
         * This property is used when instantiating the default calendar of the project. This calendar will have no availability intervals,
         * so this setting will either turn the whole timespan into working time or non-working.
         *
         * Default value is `true`
         */
        @model_field({ type : 'boolean', defaultValue : true })
        unspecifiedTimeIsWorking     : boolean

        _enableProgressNotifications : boolean

        // Stores whose dataset has been replaced. Records of those stores can be excluded from graph -> DATA update
        // since they are brand new
        repopulateStores             : Set<AbstractPartOfProjectStoreMixin>

        repopulateOnDataset          : boolean

        ignoreInitialCommitComputationCycles : boolean


        construct (config : Partial<this> = {}) {
            this.enableProgressNotifications    = config.enableProgressNotifications

            // Expand project by default to make getRange to work
            if (!('expanded' in config)) {
                // @ts-ignore
                config.expanded = true
            }

            superProto.construct.call(this, config)

            this.ignoreInitialCommitComputationCycles = ('ignoreInitialCommitComputationCycles' in config) ? config.ignoreInitialCommitComputationCycles : true

            if (!this.eventModelClass) this.eventModelClass = this.getDefaultEventModelClass()
            if (!this.eventStoreClass) this.eventStoreClass = this.getDefaultEventStoreClass()

            if (!this.dependencyModelClass) this.dependencyModelClass = this.getDefaultDependencyModelClass()
            if (!this.dependencyStoreClass) this.dependencyStoreClass = this.getDefaultDependencyStoreClass()

            if (!this.resourceModelClass) this.resourceModelClass = this.getDefaultResourceModelClass()
            if (!this.resourceStoreClass) this.resourceStoreClass = this.getDefaultResourceStoreClass()

            if (!this.assignmentModelClass) this.assignmentModelClass = this.getDefaultAssignmentModelClass()
            if (!this.assignmentStoreClass) this.assignmentStoreClass = this.getDefaultAssignmentStoreClass()

            if (!this.calendarModelClass) this.calendarModelClass = this.getDefaultCalendarModelClass()
            if (!this.calendarManagerStoreClass) this.calendarManagerStoreClass = this.getDefaultCalendarManagerStoreClass()

            this.replica = this.createReplica()

            this.replica.addEntity(this)

            // not part of the CalendarManagerStore intentionally, not persisted
            this.defaultCalendar = new this.calendarModelClass({
                unspecifiedTimeIsWorking: this.unspecifiedTimeIsWorking
            })

            this.defaultCalendar.project = this

            this.replica.addEntity(this.defaultCalendar)

            const stm = this.stm = new StateTrackingManager(ObjectHelper.assign({
                disabled : true
            }, this.stm))

            this.stm.on({
                // Propagate on undo/redo
                restoringStop: async () => {
                    // Disable STM meanwhile to not pick it up as a new STM transaction
                    this.stm.disable()
                    await this.commitAsync()
                    if (!this.isDestroyed) {
                        this.stm.enable()
                        this.trigger('stateRestoringDone')
                    }
                }
            })

            let reEnableAutoRecord

            this.on({
                // https://github.com/bryntum/support/issues/1270
                beforeCommit () {
                    if (stm.isRecording && stm.autoRecord) {
                        reEnableAutoRecord = true
                        // If auto recording is enabled when we are entering a commit, we need to move autoRecording
                        // state to Recording in order to make sure all changes from the project will become a single
                        // transaction
                        stm.autoRecord = false
                    }
                },
                dataReady () {
                    if (reEnableAutoRecord) {
                        // This will restore autoRecording state and trigger timer to stop transaction after a delay
                        stm.autoRecord = true
                        reEnableAutoRecord = false
                    }
                }
            })

            this.setCalendarManagerStore(this.calendarManagerStore)

            this.setEventStore(this.eventStore)

            this.setDependencyStore(this.dependencyStore)

            this.setResourceStore(this.resourceStore)

            this.setAssignmentStore(this.assignmentStore)

            const hasInlineData = Boolean(this.calendarsData || this.eventsData  || this.dependenciesData || this.resourcesData || this.assignmentsData)

            if (hasInlineData) {
                this.loadInlineData({
                    calendarsData       : this.calendarsData,
                    eventsData          : this.eventsData,
                    dependenciesData    : this.dependenciesData,
                    resourcesData       : this.resourcesData,
                    assignmentsData     : this.assignmentsData
                })

                delete this.calendarsData
                delete this.eventsData
                delete this.dependenciesData
                delete this.resourcesData
                delete this.assignmentsData
            }
        }


        doDestroy () {
            const me = this

            me.eventStore?.destroy()
            me.dependencyStore?.destroy()
            me.assignmentStore?.destroy()
            me.resourceStore?.destroy()
            me.calendarManagerStore?.destroy()

            me.replica.clear()

            me.stm?.destroy()

            superProto.doDestroy.call(this)
        }


        // Creates a new Replica, used during construction and when repopulating
        createReplica () {
            return EngineReplica.mix(Replica).new({
                project                              : this,
                schema                               : Schema.new(),
                enableProgressNotifications          : this.enableProgressNotifications,
                silenceInitialCommit                 : this.silenceInitialCommit,
                ignoreInitialCommitComputationCycles : this.ignoreInitialCommitComputationCycles,
                onWriteDuringCommit                  : 'ignore',
                readMode                             : ReadMode.CurrentOrProposedOrPrevious
            })
        }


        * hasSubEvents () : CalculationIterator<boolean> {
            return this.getEventStore().count > 0
        }


        * subEventsIterable () : CalculationIterator<Iterable<BaseEventMixin>> {
            return this.getEventStore().getRange()
        }


        getType () : ProjectType {
            return ProjectType.SchedulerBasic
        }

        get enableProgressNotifications () : boolean {
            return this._enableProgressNotifications
        }

        /**
         * Enables/disables the calculation progress notifications.
         */
        set enableProgressNotifications (value : boolean) {
            this._enableProgressNotifications   = value

            if (this.replica) this.replica.enableProgressNotifications  = value
        }

        /**
         * Returns the default event model class to use
         */
        getDefaultEventModelClass () : this[ 'eventModelClass' ] {
            return SchedulerBasicEvent
        }


        /**
         * Returns the default event store class to use
         */
        getDefaultEventStoreClass () : this[ 'eventStoreClass' ] {
            return ChronoEventStoreMixin
        }


        /**
         * Returns the default dependency model class to use
         */
        getDefaultDependencyModelClass () : this[ 'dependencyModelClass' ] {
            return BaseDependencyMixin
        }


        /**
         * Returns the default dependency store class to use
         */
        getDefaultDependencyStoreClass () : this[ 'dependencyStoreClass' ] {
            return ChronoDependencyStoreMixin
        }


        /**
         * Returns the default resource model class to use
         */
        getDefaultResourceModelClass () : this[ 'resourceModelClass' ] {
            return BaseResourceMixin
        }


        /**
         * Returns the default resource store class to use
         */
        getDefaultResourceStoreClass () : this[ 'resourceStoreClass' ] {
            return ChronoResourceStoreMixin
        }


        /**
         * Returns the default assignment model class to use
         */
        getDefaultAssignmentModelClass () : this[ 'assignmentModelClass' ] {
            return BaseAssignmentMixin
        }


        /**
         * Returns the default assignment store class to use
         */
        getDefaultAssignmentStoreClass () : this[ 'assignmentStoreClass' ] {
            return ChronoAssignmentStoreMixin
        }


        /**
         * Returns the default calendar model class to use
         */
        getDefaultCalendarModelClass () : this[ 'calendarModelClass' ] {
            return BaseCalendarMixin
        }


        /**
         * Returns the default calendar manager store class to use
         */
        getDefaultCalendarManagerStoreClass () : this[ 'calendarManagerStoreClass' ] {
            return ChronoCalendarManagerStoreMixin
        }


        /**
         * This method loads the "raw" data into the project. The loading is basically happening by
         * assigning the individual data entries to the `data` property of the corresponding store.
         *
         * @param data
         */
        async loadInlineData (data : ProjectDataPackage) : Promise<CommitResult> {
            const { calendarManagerStore, eventStore, dependencyStore, assignmentStore, resourceStore } = this

            // Prevent initial commit from happening before inline data is loaded
            this.replica.unScheduleAutoCommit()

            if (this.replica.enableProgressNotifications) {
                // First delay needed to allow assignment of Project -> Gantt to happen before carrying on,
                // to make sure progress listener is in place
                await delay(0)
                this.replica.onPropagationProgressNotification({ total : 0, remaining : 0, phase : 'storePopulation' })
                // Second delay needed to allow mask to appear, not clear why delay(0) is not enough, it works in other
                // places
                await delay(50)
            }

            this.isLoadingInlineData = true

            if (BrowserHelper.global.DEBUG) {
                console.log(`%cInitializing project`, 'font-weight:bold;color:darkgreen;text-transform:uppercase;margin-top: 2em')
                console.time('Time to visible')
                console.time('Populating project')
            }

            if (data.calendarsData) {
                this.repopulateStore(calendarManagerStore)

                calendarManagerStore.data    = data.calendarsData
            }
            if (data.eventsData || data.tasksData) {
                this.repopulateStore(eventStore)

                eventStore.data              = data.eventsData || data.tasksData
            }
            if (data.dependenciesData) {
                this.repopulateStore(dependencyStore)

                dependencyStore.data         = data.dependenciesData
            }
            if (data.resourcesData) {
                this.repopulateStore(resourceStore)

                resourceStore.data           = data.resourcesData
            }
            if (data.assignmentsData) {
                this.repopulateStore(assignmentStore)

                assignmentStore.data         = data.assignmentsData
            }

            if (BrowserHelper.global.DEBUG) console.timeEnd('Populating project')

            await this.commitLoad()

            this.isLoadingInlineData = false

            return
        }


        async commitLoad () {
            // if (BrowserHelper.global.DEBUG) console.time('Initial propagation')

            await this.commitAsync()

            // Might have been destroyed during the async operation above
            if (!this.isDestroyed) this.trigger('load')
        }


        //region Repopulate


        get isRepopulatingStores () : boolean {
            return Boolean(this.repopulateStores?.size)
        }


        // Remember which stores are being repopulated, they dont have to care about unjoining graph later
        repopulateStore (store : AbstractPartOfProjectStoreMixin) {
            if (this.repopulateOnDataset && store.count) {

                if (!this.repopulateStores) this.repopulateStores = new Set<AbstractPartOfProjectStoreMixin>()

                this.repopulateStores.add(store)

                // Trigger buffered repopulate of replica
                this.repopulateReplica()

            }
        }


        // Creates a new replica, populating it with data from the stores
        repopulateReplica () {
            const {
                calendarManagerStore,
                eventStore,
                dependencyStore,
                assignmentStore,
                resourceStore,
                replica : oldReplica
            } = this

            // Unlink all old records that are going to be re-entered into new replica
            this.unlinkStoreRecords(calendarManagerStore, eventStore, dependencyStore, resourceStore, assignmentStore)
            this.unlinkRecord(this)
            this.unlinkRecord(this.defaultCalendar)

            oldReplica.clear()

            const replica = this.replica = this.createReplica()

            // Now enter all new and old reused records into the new replica
            replica.addEntity(this)
            replica.addEntity(this.defaultCalendar)

            this.joinStoreRecords(calendarManagerStore, true)
            this.joinStoreRecords(eventStore, true)
            this.joinStoreRecords(dependencyStore, true)
            this.joinStoreRecords(resourceStore, true)
            this.joinStoreRecords(assignmentStore, true)

            this.repopulateStores.clear()
        }


        // If there is a commit when we are supposed to replace the replica, we hijack that and commit the new replica
        beforeCommitAsync () : Promise<CommitResult> {
            //@ts-ignore
            if (this.repopulateReplica.isPending) {
                //@ts-ignore
                this.repopulateReplica.now()

                return this.replica.commitAsync()
            }

            return null
        }


        // Unlinks a single record from the graph, writing back identifiers values from the graph to DATA to allow them
        // to enter another replica
        unlinkRecord (record : ChronoPartOfProjectModelMixin) {
            const { activeTransaction } = this.replica
            const { $ }                 = record
            const keys                  = Object.keys($)

            // Write current values to identifier.DATA, to have correct value entering new replica later
            for (let i = 0; i < keys.length; i++) {
                const key        = keys[i]
                const identifier = $[key]

                // Relations: assignment.event, replace event instance with event id
                if (identifier.field instanceof ModelReferenceField) {
                    const value = record[key]
                    // id for records, value for atomics, undefined otherwise
                    identifier.DATA = value?.id ?? value
                }
                // Everything else, use latest value
                else {
                    const entry = activeTransaction.getLatestStableEntryFor(identifier)
                    if (entry) identifier.DATA = entry.getValue()
                }
            }

            // Cut the link, to enable joining another replica
            record.graph = null
        }


        // Unlinks all records from a store, unless the store has been repopulated
        unlinkStoreRecords (...stores : ChronoPartOfProjectStoreMixin[]) {
            // Must pass includeFilteredOutRecords as true
            // so that we work on full, unfiltered dataset
            stores.forEach(store => store.traverse((record : ChronoPartOfProjectModelMixin) => {
                // Unlink records only in stores that are not repopulated
                if (!this.repopulateStores.has(store)) {
                    this.unlinkRecord(record)
                }
            }, false, false, true))
        }


        //endregion


        getGraph () : EngineReplica {
            return this.replica
        }


        // keep this private
        async addEvents (events : InstanceType<this[ 'eventModelClass' ]>[]) : Promise<CommitResult> {
            this.eventStore.add(events)

            return this.graph.commitAsync()
        }


        // keep this private
        async addEvent (event : InstanceType<this[ 'eventModelClass' ]>) : Promise<CommitResult> {
            this.eventStore.add(event)

            return this.graph.commitAsync()
        }


        // keep this private
        includeEvent (event : InstanceType<this[ 'eventModelClass' ]>) {
            this.eventStore.add(event)
        }


        // keep this private
        async removeEvents (events : InstanceType<this[ 'eventModelClass' ]>[]) : Promise<CommitResult> {
            this.eventStore.remove(events)

            return this.graph.commitAsync()
        }


        // keep this private
        excludeEvent (event : InstanceType<this[ 'eventModelClass' ]>) {
            this.eventStore.remove(event)
        }


        // keep this private
        async removeEvent (event : InstanceType<this[ 'eventModelClass' ]>) : Promise<CommitResult> {
            this.eventStore.remove(event)

            return this.graph.commitAsync()
        }


        getStm () : StateTrackingManager {
            return this.stm
        }


        calculateProject () : this {
            return this
        }


        // @ts-ignore
        resolveCalendar (locator : string) {
            return super.resolveCalendar(locator) || this.defaultCalendar
        }


        joinStoreRecords (store : ChronoPartOfProjectStoreMixin, skipRoot = false) {
            const fn = (record : ChronoPartOfProjectModelMixin) => {
                record.setProject(this)
                record.joinProject()
            }

            // Both iteration methods must pass includeFilteredOutRecords as true
            // so that we work on full, unfiltered dataset
            if (store.rootNode) {
                store.rootNode.traverse(fn, skipRoot, true)
            } else {
                store.forEach(fn, null, true)
            }
        }


        unJoinStoreRecords (store : ChronoPartOfProjectStoreMixin) {
            const fn = (record : ChronoPartOfProjectModelMixin) => {
                record.leaveProject()
                record.setProject(this)
            }

            // Both iteration methods must pass includeFilteredOutRecords as true
            // so that we work on full, unfiltered dataset
            if (store.rootNode) {
                (store.rootNode as ChronoPartOfProjectModelMixin).traverse(node => {
                    // do not unjoin/leave project for the root node, which is the project itself
                    if (node !== store.rootNode) fn(node)
                }, false, true)
            } else {
                store.forEach(fn, null, true)
            }
        }


        /**
         * This method sets the event store instance for the project.
         * @param store
         */
        setEventStore (store : ChronoEventStoreMixin) {
            const oldEventStore = this.eventStore

            if (oldEventStore && this.stm.hasStore(oldEventStore)) {
                this.stm.removeStore(oldEventStore)
                this.unJoinStoreRecords(oldEventStore)

                const assignmentsForRemoval = oldEventStore.assignmentsForRemoval

                // remap the assignment
                assignmentsForRemoval.forEach(assignment => {
                    const oldEvent  = assignment.event

                    if (oldEvent) {
                        const newEvent  = store.getById(oldEvent.id)

                        if (newEvent) {
                            assignment.event    = newEvent
                            // keep the assignment
                            assignmentsForRemoval.delete(assignment)
                        }
                    }
                })

                oldEventStore.afterEventRemoval()
            }

            if (!store || !(store instanceof Store)) {
                const storeClass = store?.storeClass || this.eventStoreClass

                this.eventStore = new storeClass(ObjectHelper.assign({
                    modelClass  : this.eventModelClass,

                    project     : this,

                    stm         : this.stm
                }, store || {}))
            }
            else {
                this.eventStore = store

                store.setProject(this)
                this.stm.addStore(store)

                // we've been given an event store from the outside
                // need to change its root node to be the project
                if (store.tree && store.rootNode !== this) {
                    this.appendChild(store.rootNode.children || [])
                    // Assigning a new root will make all children join store
                    store.rootNode = this
                }
                // TODO: Not sure about this, was always performed previously
                else {
                    this.joinStoreRecords(store)
                }
            }

            this.trigger('eventStoreChange', { store : this.eventStore })
        }


        /**
         * This method sets the dependency store instance for the project.
         * @param store
         */
        setDependencyStore (store : ChronoDependencyStoreMixin) {
            const oldDependencyStore = this.dependencyStore

            if (oldDependencyStore && this.stm.hasStore(oldDependencyStore)) {
                this.stm.removeStore(oldDependencyStore)
            }

            if (!store || !(store instanceof Store)) {
                const storeClass = store?.storeClass || this.dependencyStoreClass

                this.dependencyStore = new storeClass(ObjectHelper.assign({
                    modelClass  : this.dependencyModelClass,

                    project     : this,

                    stm         : this.stm
                }, store || {}))
            }
            else {
                this.dependencyStore = store

                store.setProject(this)
                this.stm.addStore(store)
                this.joinStoreRecords(store)
            }

            this.trigger('dependencyStoreChange', { store : this.dependencyStore })
        }


        /**
         * This method sets the resource store instance for the project.
         * @param store
         */
        setResourceStore (store : ChronoResourceStoreMixin) {
            const oldResourceStore = this.resourceStore

            if (oldResourceStore && this.stm.hasStore(oldResourceStore)) {
                this.stm.removeStore(oldResourceStore)
                this.unJoinStoreRecords(oldResourceStore)

                const assignmentsForRemoval = oldResourceStore.assignmentsForRemoval

                // remap the assignment
                assignmentsForRemoval.forEach(assignment => {
                    const oldResource  = assignment.resource

                    if (oldResource) {
                        const newResource  = store.getById(oldResource.id)

                        if (newResource) {
                            assignment.resource    = newResource
                            // keep the assignment
                            assignmentsForRemoval.delete(assignment)
                        }
                    }
                })

                oldResourceStore.afterResourceRemoval()
            }

            if (!store || !(store instanceof Store)) {
                const storeClass = store?.storeClass || this.resourceStoreClass

                this.resourceStore = new storeClass(ObjectHelper.assign({
                    modelClass  : this.resourceModelClass,

                    project     : this,

                    stm     : this.stm
                }, store || {}))
            }
            else {
                this.resourceStore = store

                store.setProject(this)
                this.stm.addStore(store)
                this.joinStoreRecords(store)
            }

            this.trigger('resourceStoreChange', { store : this.resourceStore })
        }


        /**
         * This method sets the assignment store instance for the project.
         * @param store
         */
        setAssignmentStore (store : ChronoAssignmentStoreMixin) {
            const oldAssignmentStore = this.assignmentStore

            if (oldAssignmentStore && this.stm.hasStore(oldAssignmentStore)) {
                this.stm.removeStore(oldAssignmentStore)
                this.unJoinStoreRecords(oldAssignmentStore)
            }

            if (!store || !(store instanceof Store)) {
                const storeClass = store?.storeClass || this.assignmentStoreClass

                this.assignmentStore = new storeClass(ObjectHelper.assign({

                    modelClass  : this.assignmentModelClass,

                    project     : this,

                    stm         : this.stm
                }, store || {}))
            }
            else {
                this.assignmentStore = store

                store.setProject(this)
                this.stm.addStore(store)
                this.joinStoreRecords(store)
            }

            this.trigger('assignmentStoreChange', { store : this.assignmentStore })
        }


        /**
         * This method sets the calendar manager store instance for the project.
         * @param store
         */
        setCalendarManagerStore (store : ChronoCalendarManagerStoreMixin) {
            const oldCalendarManagerStore = this.calendarManagerStore

            if (oldCalendarManagerStore && this.stm.hasStore(oldCalendarManagerStore)) {
                this.stm.removeStore(oldCalendarManagerStore)
            }

            if (!store || !(store instanceof Store)) {
                const storeClass = store?.storeClass || this.calendarManagerStoreClass

                this.calendarManagerStore = new storeClass(ObjectHelper.assign({

                    modelClass  : this.calendarModelClass,

                    project     : this,

                    stm         : this.stm
                }, store || {}))
            }
            else {
                this.calendarManagerStore = store

                if (store) {
                    store.setProject(this)
                    this.stm.addStore(store)
                    this.joinStoreRecords(store)
                }
            }

            this.trigger('calendarManagerStoreChange', { store : this.calendarManagerStore })
        }


        // this does not account for possible scheduling conflicts
        async isValidDependency (...args) : Promise<boolean> {
            return true
        }


        async tryPropagateWithChanges (changerFn : Function) : Promise<boolean> {
            const
                stm = this.stm

            let stmInitiallyDisabled : boolean,
                stmInitiallyAutoRecord : boolean

            const captureStm = () => {
                stmInitiallyDisabled = stm.disabled
                stmInitiallyAutoRecord = stm.autoRecord

                if (stmInitiallyDisabled) {
                    stm.enable()
                }
                else {
                    if (stmInitiallyAutoRecord) {
                        stm.autoRecord = false
                    }
                    if (stm.isRecording) {
                        stm.stopTransaction()
                    }
                }
            }

            const commitStmTransaction = () => {
                stm.stopTransaction()

                if (stmInitiallyDisabled) {
                    stm.resetQueue()
                }
            }

            const rejectStmTransaction = () => {
                if (stm.transaction.length) {

                    stm.forEachStore(s => s.beginBatch())

                    stm.rejectTransaction()

                    stm.forEachStore(s => s.endBatch())
                }
                else {
                    stm.stopTransaction()
                }
            }

            const freeStm = () => {
                stm.disabled = stmInitiallyDisabled
                stm.autoRecord = stmInitiallyAutoRecord
            }

            captureStm()

            stm.startTransaction()

            // In case anything in, or called by the changerFn attempts to propagate.
            // We must only propagate after the changes have been made.
            // this.suspendPropagate()

            changerFn()

            // Resume propagation, but do *not* propagate if any propagate calls were attempted during suspension.
            // this.resumePropagate(false)

            let result = true

            try {
                const commitResult = await this.commitAsync()

                // setting "result" to false if the propagation was rejected
                result  = !commitResult.rejectedWith

            } catch (e) {
                // rethrow non-cycle exception
                if (!/cycle/i.test(e)) throw e

                result      = false
            }

            if (result) {
                commitStmTransaction()
            }
            else {
                this.replica.reject()
                rejectStmTransaction()
            }

            freeStm()

            return result
        }

        isEngineReady () : boolean {
            const { replica } = this

            return  !(replica.dirty && (replica.hasPendingAutoCommit() || replica.isCommitting || this.isRepopulatingStores))
        }

        // Needed to separate configs from data, for tests to pass. Normally handled in ProjectModel outside of engine
        static get defaultConfig () : object {
            return {
                assignmentsData      : null,
                calendarsData        : null,
                dependenciesData     : null,
                eventsData           : null,
                resourcesData        : null,

                // need to distinguish the stores from fields
                // https://www.bryntum.com/examples/gantt/advanced/index.umd.html
                // bryntum.gantt.ObjectHelper.isEqual({}, new bryntum.gantt.Store()) // true
                eventStore           : null,
                resourceStore        : null,
                assignmentStore      : null,
                dependencyStore      : null,
                calendarManagerStore : null,

                eventModelClass      : null,
                resourceModelClass   : null,
                assignmentModelClass : null,
                dependencyModelClass : null,
                calendarModelClass   : null,

                repopulateOnDataset  : true
            }
        }

        static get delayable () : object {
            return {
                repopulateReplica : 10
            }
        }

        static applyConfigs : boolean = true
    }

    return SchedulerBasicProjectMixin
}){}
