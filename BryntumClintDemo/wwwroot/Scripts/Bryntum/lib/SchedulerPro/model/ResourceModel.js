import GridRowModel from '../../Grid/data/GridRowModel.js';
import ResourceModelMixin from '../../Scheduler/model/mixin/ResourceModelMixin.js';
import { SchedulerProResourceMixin } from '../../Engine/quark/model/scheduler_pro/SchedulerProResourceMixin.js';
import PartOfProject from '../data/mixin/PartOfProject.js';

/**
 * @module SchedulerPro/model/ResourceModel
 */

/**
 * This class represent a single Resource in Scheduler Pro, usually added to a {@link SchedulerPro.data.ResourceStore}.
 *
 * It is a subclass of  {@link Core.data.Model}. Please refer to the documentation for that class to become familiar
 * with the base interface of the resource.
 *
 * ## Fields and references
 *
 * A resource has a few predefined fields, see Fields below. If you want to add more fields with meta data describing
 * your resources then you should subclass this class:
 *
 * ```javascript
 * class MyResource extends ResourceModel {
 *   static get fields() {
 *     return [
 *       // "id" and "name" fields are already provided by the superclass
 *       { name: 'company', type : 'string' }
 *     ];
 *   }
 * });
 * ```
 *
 * If you want to use other names in your data for the id and name fields you can configure them as seen below:
 *
 * ```javascript
 * class MyResource extends ResourceModel {
 *   static get fields() {
 *     return [
 *        { name: 'name', dataSource: 'userName' }
 *     ];
 *   },
 * });
 * ```
 *
 * After load and project normalization, these references are accessible (assuming their respective stores are loaded):
 * - `assignments` - The linked assignment records
 * - `events` - The linked (through assignments) event records
 *
 * ## Async resolving of references
 *
 * As described above, a resource has links to assignments and events. These references are populated async, using the
 * calculation engine of the project that the resource via its store is a part of. Because of this asyncness, references
 * cannot be used immediately after assignment modifications:
 *
 * ```javascript
 * assignment.resourceId = 2;
 * // resource.assignments is not yet up to date
 * ```
 *
 * To make sure references are updated, wait for calculations to finish:
 *
 * ```javascript
 * assignment.resourceId = 2;
 * await assignment.project.commitAsync();
 * // resource.assignments is up to date
 * ```
 *
 * As an alternative, you can also use `setAsync()` to trigger calculations directly after the change:
 *
 * ```javascript
 * await assignment.setAsync({ resourceId : 2});
 * // resource.assignments is up to date
 * ```
 *
 * @extends Grid/data/GridRowModel
 * @mixes Scheduler/model/mixin/ResourceModelMixin
 *
 * @typings Scheduler/model/ResourceModel -> Scheduler/model/SchedulerResourceModel
 */
export default class ResourceModel extends PartOfProject(ResourceModelMixin(SchedulerProResourceMixin.derive(GridRowModel))) {

    //region Calendar

    /**
     * Sets the calendar of the task. Will cause the schedule to be updated - returns a `Promise`
     *
     * @method
     * @name setCalendar
     * @param {SchedulerPro.model.CalendarModel} calendar The new calendar. Provide `null` to use the project calendar.
     * @returns {Promise}
     * @propagating
     */

    /**
     * Returns a calendar of the task. If no calendar was assigned, then project's calendar will be returned.
     *
     * @method
     * @name getCalendar
     * @returns {SchedulerPro.model.CalendarModel}
     */

    /**
     * The calendar, assigned to the entity. Allows you to set the time when entity can perform the work.
     *
     * All entities are by default assigned to the project calendar, provided as the {@link SchedulerPro.model.ProjectModel#property-calendar} option.
     *
     * @field {SchedulerPro.model.CalendarModel} calendar
     * @category Scheduling
     */

    //endregion

    //region Config

    static get $name() {
        return 'ResourceModel';
    }

    //endregion
}
