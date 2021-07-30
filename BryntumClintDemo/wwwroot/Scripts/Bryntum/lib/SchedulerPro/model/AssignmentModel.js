import Model from '../../Core/data/Model.js';
import AssignmentModelMixin from '../../Scheduler/model/mixin/AssignmentModelMixin.js';
import { SchedulerProAssignmentMixin } from '../../Engine/quark/model/scheduler_pro/SchedulerProAssignmentMixin.js';
import PartOfProject from '../data/mixin/PartOfProject.js';

/**
 * @module SchedulerPro/model/AssignmentModel
 */

/**
 * This class represent a single assignment of a resource to an event in Scheduler Pro. It has a lot in common with
 * Schedulers AssignmentModel, they are separate models but they share much functionality using the
 * {@link Scheduler.model.mixin.AssignmentModelMixin AssignmentModelMixin} mixin.
 *
 * It is a subclass of {@link Core.data.Model} class. Please refer to the documentation for that class to become
 * familiar with the base interface of this class.
 *
 * ## Fields and references
 *
 * An Assignment has the following fields:
 * - `id` - The id of the assignment
 * - `resourceId` - The id of the resource assigned (optionally replaced with `resource` for load)
 * - `eventId` - The id of the event to which the resource is assigned (optionally replaced with `event` for load)
 *
 * The data source for these fields can be customized by subclassing this class:
 *
 * ```javascript
 * class MyAssignment extends AssignmentModel {
 *   static get fields() {
 *       return [
 *          { name : 'resourceId', dataSource : 'linkedResource' }
 *       ];
 *   }
 * }
 * ```
 *
 * After load and project normalization, these references are accessible (assuming their respective stores are loaded):
 * - `event` - The linked event record
 * - `resource` - The linked resource record
 *
 * ## Async resolving of references
 *
 * As described above, an assignment links an event to a resource. It holds references to an event record and a resource
 * record. These references are populated async, using the calculation engine of the project that the assignment via
 * its store is a part of. Because of this asyncness, references cannot be used immediately after modifications:
 *
 * ```javascript
 * assignment.resourceId = 2;
 * // assignment.resource is not yet available
 * ```
 *
 * To make sure references are updated, wait for calculations to finish:
 *
 * ```javascript
 * assignment.resourceId = 2;
 * await assignment.project.commitAsync();
 * // assignment.resource is available
 * ```
 *
 * As an alternative, you can also use `setAsync()` to trigger calculations directly after the change:
 *
 * ```javascript
 * await assignment.setAsync({ resourceId : 2});
 * // assignment.resource is available
 * ```
 *
 * @extends Core/data/Model
 * @mixes Scheduler/model/mixin/AssignmentModelMixin
 * @uninherit Core/data/mixin/TreeNode
 * @typings Scheduler/model/AssignmentModel -> Scheduler/model/SchedulerAssignmentModel
 */
export default class AssignmentModel extends PartOfProject(AssignmentModelMixin(SchedulerProAssignmentMixin.derive(Model))) {

    //region Config

    static get $name() {
        return 'AssignmentModel';
    }

    static get isProAssignmentModel() {
        return true;
    }

    //endregion
}
