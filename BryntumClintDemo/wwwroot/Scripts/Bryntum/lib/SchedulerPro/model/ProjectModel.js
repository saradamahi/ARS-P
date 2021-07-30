import { SchedulerProProjectMixin } from '../../Engine/quark/model/scheduler_pro/SchedulerProProjectMixin.js';
import ProjectModelMixin from '../../Scheduler/model/mixin/ProjectModelMixin.js';

import ProjectCrudManager from '../data/mixin/ProjectCrudManager.js';

import AssignmentModel from './AssignmentModel.js';
import CalendarModel from './CalendarModel.js';
import DependencyModel from './DependencyModel.js';
import EventModel from './EventModel.js';
import ResourceModel from './ResourceModel.js';

import CalendarManagerStore from '../data/CalendarManagerStore.js';
import DependencyStore from '../data/DependencyStore.js';
import EventStore from '../data/EventStore.js';
import ResourceStore from '../data/ResourceStore.js';
import AssignmentStore from '../data/AssignmentStore.js';

/**
 * @module SchedulerPro/model/ProjectModel
 */

/**
 * Scheduler Pro Project model class - a central place for all data.
 *
 * It holds and links the stores usually used by Scheduler Pro:
 *
 * - {@link SchedulerPro.data.EventStore}
 * - {@link SchedulerPro.data.ResourceStore}
 * - {@link SchedulerPro.data.AssignmentStore}
 * - {@link SchedulerPro.data.DependencyStore}
 * - {@link SchedulerPro.data.CalendarManagerStore}
 * - {@link Scheduler.data.ResourceTimeRangeStore}
 * - {@link #config-timeRangeStore TimeRangeStore}
 *
 * The project uses a scheduling engine to calculate dates, durations and such. It is also responsible for
 * handling references between models, for example to link an event via an assignment to a resource. These operations
 * are asynchronous, a fact that is hidden when working in the Scheduler Pro UI but which you must know about when
 * performing operations on the data level.
 *
 * When there is a change to data that requires something else to be recalculated, the project schedules a calculation
 * (a commit) which happens moments later. It is also possible to trigger these calculations directly. This flow
 * illustrates the process:
 *
 * 1. Something changes which requires the project to recalculate, for example adding a new task:
 *
 * ```javascript
 * const [event] = project.eventStore.add({ startDate, endDate });
 * ```
 *
 * 2. A recalculation is scheduled, thus:
 *
 * ```javascript
 * event.duration; // <- Not yet calculated
 * ```
 *
 * 3. Calculate now instead of waiting for the scheduled calculation
 *
 * ```javascript
 * await project.commitAsync();
 *
 * event.duration; // <- Now available
 * ```
 *
 * Please refer to [this guide](#guides/schedulerpro/project_data.md) for more information.
 *
 * ## Built in CrudManger
 *
 * Scheduler Pro's project has a {@link Scheduler.data.CrudManager CrudManager} built in. Using it is the recommended
 * way of syncing data between Scheduler Pro and a backend. Example usage:
 *
 * ```javascript
 * const scheduler = new SchedulerPro({
 *     project : {
 *         // Configure urls used by the built in CrudManager
 *         transport : {
 *             load : {
 *                 url : 'php/load.php'
 *             },
 *             sync : {
 *                 url : 'php/sync.php'
 *             }
 *         }
 *     }
 * });
 *
 * // Load data from the backend
 * scheduler.project.load()
 * ```
 *
 * For more information on CrudManager, see Schedulers docs on {@link Scheduler.data.CrudManager}.
 * For a detailed description of the protocol used by CrudManager, see the [Crud manager guide](#guides/data/crud_manager.md)
 *
 * You can access the current Project data changes anytime using the {@link #property-changes} property.
 *
 * ## Working with inline data
 *
 * The project provides an {@link Scheduler.crud.AbstractCrudManager#property-inlineData} getter/setter that can
 * be used to manage data from all Project stores at once. Populating the stores this way can
 * be useful if you do not want to use the CrudManager for server communication but instead load data using Axios
 * or similar.
 *
 * ### Getting data
 * ```javascript
 * const data = scheduler.project.inlineData;
 *
 * // use the data in your application
 * ```
 *
 * ### Setting data
 * ```javascript
 * // Get data from server manually
 * const data = await axios.get('/project?id=12345');
 *
 * // Feed it to the project
 * scheduler.project.inlineData = data;
 * ```
 *
 * See also {@link Scheduler/model/mixin/ProjectModelMixin#function-loadInlineData}
 *
 * ### Getting changed records
 *
 * You can access the changes in the current Project dataset anytime using the {@link #property-changes} property. It
 * returns an object with all changes:
 * ```
 * const changes = project.changes;
 *
 * console.log(changes);
 *
 * > {
 *   tasks : {
 *       updated : [{
 *           name : 'My task',
 *           id   : 12
 *       }]
 *   },
 *   assignments : {
 *       added : [{
 *           event      : 12,
 *           resource   : 7,
 *           units      : 100,
 *           $PhantomId : 'abc123'
 *       }]
 *     }
 * };
 * ```
 *
 * ## Built in StateTrackingManager
 *
 * The project also has a built in {@link Core.data.stm.StateTrackingManager StateTrackingManager} (STM for short), that
 * handles undo/redo for the project stores (additional stores can also be added). By default, it is only used while
 * editing tasks using the task editor, the editor updates tasks live and uses STM to rollback changes if canceled. But
 * you can enable it to track all project store changes:
 *
 * ```javascript
 * // Enable automatic transaction creation and start recording
 * project.stm.autoRecord = true;
 * project.stm.enable();
 *
 * // Undo a transaction
 * project.stm.undo();
 *
 * // Redo
 * project.stm.redo();
 * ```
 *
 * Check out the `undoredo` demo to see it in action.
 *
 * @mixes SchedulerPro/data/mixin/PartOfProject
 * @mixes SchedulerPro/data/mixin/ProjectCrudManager
 * @mixes Core/mixin/Events
 *
 * @extends Scheduler/model/mixin/ProjectModelMixin
 *
 * @typings Scheduler/model/ProjectModel -> Scheduler/model/SchedulerProjectModel
 */
export default class ProjectModel extends ProjectCrudManager(SchedulerProProjectMixin.derive(ProjectModelMixin())) {

    //region Config

    static get $name() {
        return 'ProjectModel';
    }

    /**
     * Silences propagations caused by the project loading.
     *
     * Applying the loaded data to the project occurs in two basic stages:
     *
     * 1. Data gets into the engine graph which triggers changes propagation
     * 2. The changes caused by the propagation get written to related stores
     *
     * Setting this flag to `true` makes the component perform step 2 silently without triggering events causing reactions on those changes
     * (like sending changes back to the server if `autoSync` is enabled) and keeping stores in unmodified state.
     *
     * This is safe if the loaded data is consistent so propagation doesn't really do any adjustments.
     * By default the system treats the data as consistent so this option is `true`.
     *
     * ```js
     * new SchedulerPro{
     *     project : {
     *         // We want scheduling engine to recalculate the data properly
     *         // so then we could save it back to the server
     *         silenceInitialCommit : false,
     *         ...
     *     }
     *     ...
     * })
     * ```
     *
     * @config {Boolean} silenceInitialCommit
     * @default true
     */

    /**
     * The number of hours per day (is used when converting the duration from one unit to another).
     * @field {Number} hoursPerDay
     * @default 24
     */

    /**
     * The number of days per week (is used when converting the duration from one unit to another).
     * @field {number} daysPerWeek
     * @default 7
     */

    /**
     * The number of days per month (is used when converting the duration from one unit to another).
     * @field {number} daysPerMonth
     * @default 30
     */

    /**
     * The scheduling direction of the project events.
     * Possible values are `Forward` and `Backward`. The `Forward` direction corresponds to the As-Soon-As-Possible scheduling (ASAP),
     * `Backward` - to As-Late-As-Possible (ALAP).
     * @field {String} direction
     * @default 'Forward'
     */

    /**
     * The source of the calendar for dependencies (the calendar used for taking dependencies lag into account).
     * Possible values are:
     *
     * - `ToEvent` - successor calendar will be used (default);
     * - `FromEvent` - predecessor calendar will be used;
     * - `Project` - the project calendar will be used.
     *
     * @field {string} dependenciesCalendar
     * @default 'ToEvent'
     */

    /**
     * The project calendar.
     * @field {SchedulerPro.model.CalendarModel} calendar
     */

    /**
     * The project calendar.
     * @member {SchedulerPro.model.CalendarModel} calendar
     */

    /**
     * Project changes (CRUD operations to records in its stores) are automatically committed on a buffer to the
     * underlying graph based calculation engine. The engine performs it calculations async.
     *
     * By calling this function, the commit happens right away. And by awaiting it you are sure that project
     * calculations are finished and that references between records are up to date.
     *
     * The returned promise is resolved with an object. If that object has `rejectedWith` set, there has been a conflict and the calculation failed.
     *
     * ```javascript
     * // Move an event in time
     * eventStore.first.shift(1);
     *
     * // Trigger calculations directly and wait for them to finish
     * const result = await project.commitAsync();
     *
     * if (result.rejectedWith) {
     *     // there was a conflict during the scheduling
     * }
     * ```
     *
     * @async
     * @returns {Promise}
     * @function commitAsync
     */

    /**
     * DEPRECATED. Use {@link #function-commitAsync} instead.
     * @deprecated
     * @returns {Promise}
     * @function propagate
     */

    /**
     * Collection of the project calendars.
     * @member {SchedulerPro.data.CalendarManagerStore} calendarManagerStore
     */

    /**
     * Set to `true` to enable calculation progress notifications.
     * When enabled the project fires {@link #event-progress progress} event.
     *
     * **Note**: Enabling progress notifications will impact calculation performance, since it needs to pause calculations to allow redrawing the UI.
     * @name enableProgressNotifications
     * @config {Boolean}
     * @category Engine
     */
    /**
     * Enables/disables the calculation progress notifications.
     * @name enableProgressNotifications
     * @member {Boolean}
     * @category Engine
     */

    /**
     * Fired during the Engine calculation if {@link #config-enableProgressNotifications enableProgressNotifications} config is `true`
     * @event progress
     * @param {Number} total The total number of operations
     * @param {Number} remaining The number of remaining operations
     * @param {String} phase The phase of the calculation, either 'storePopulation' when data is getting loaded, or 'propagating' when data is getting calculated
     */

    static get defaultConfig() {
        return {
            /**
             * The constructor of the calendar model class, to be used in the project. Will be set as the {@link Core.data.Store#config-modelClass modelClass}
             * property of the {@link #property-calendarManagerStore}
             *
             * @config {SchedulerPro.model.CalendarModel} [calendarModelClass]
             * @category Models & Stores
             */
            calendarModelClass : CalendarModel,

            /**
             * The constructor of the dependency model class, to be used in the project. Will be set as the
             * {@link Core.data.Store#config-modelClass modelClass} property of the {@link #property-dependencyStore}
             *
             * @config {SchedulerPro.model.DependencyModel}
             * @category Models & Stores
             */
            dependencyModelClass : DependencyModel,

            /**
             * The constructor of the event model class, to be used in the project. Will be set as the
             * {@link Core.data.Store#config-modelClass modelClass} property of the {@link #property-eventStore}
             *
             * @config {SchedulerPro.model.EventModel}
             * @category Models & Stores
             */
            eventModelClass : EventModel,

            /**
             * The constructor of the assignment model class, to be used in the project. Will be set as the
             * {@link Core.data.Store#config-modelClass modelClass} property of the {@link #property-assignmentStore}
             *
             * @config {SchedulerPro.model.AssignmentModel}
             * @category Models & Stores
             */
            assignmentModelClass : AssignmentModel,

            /**
             * The constructor of the resource model class, to be used in the project. Will be set as the
             * {@link Core.data.Store#config-modelClass modelClass} property of the {@link #property-resourceStore}
             *
             * @config {SchedulerPro.model.ResourceModel}
             * @category Models & Stores
             */
            resourceModelClass : ResourceModel,

            /**
             * The constructor to create a calendar store instance with. Should be a class, subclassing the
             * {@link SchedulerPro.data.CalendarManagerStore}
             * @config {SchedulerPro.data.CalendarManagerStore|Object}
             * @category Models & Stores
             */
            calendarManagerStoreClass : CalendarManagerStore,

            /**
             * The constructor to create a dependency store instance with. Should be a class, subclassing the
             * {@link SchedulerPro.data.DependencyStore}
             * @config {SchedulerPro.data.DependencyStore|Object}
             * @category Models & Stores
             */
            dependencyStoreClass : DependencyStore,

            /**
             * The constructor to create an event store instance with. Should be a class, subclassing the
             * {@link SchedulerPro.data.EventStore}
             * @config {SchedulerPro.data.EventStore|Object}
             * @category Models & Stores
             */
            eventStoreClass : EventStore,

            /**
             * The constructor to create an assignment store instance with. Should be a class, subclassing the
             * {@link SchedulerPro.data.AssignmentStore}
             * @config {SchedulerPro.data.AssignmentStore|Object}
             * @category Models & Stores
             */
            assignmentStoreClass : AssignmentStore,

            /**
             * The constructor to create a resource store instance with. Should be a class, subclassing the
             * {@link SchedulerPro.data.ResourceStore}
             * @config {SchedulerPro.data.ResourceStore|Object}
             * @category Models & Stores
             */
            resourceStoreClass : ResourceStore,

            /**
             * The initial data, to fill the {@link #property-calendarManagerStore} with.
             * Should be an array of {@link SchedulerPro.model.CalendarModel} or it's configuration objects.
             *
             * @config {SchedulerPro.model.CalendarModel[]}
             * @category Inline data
             */
            calendarsData : null
        };
    }

    //endregion

}
