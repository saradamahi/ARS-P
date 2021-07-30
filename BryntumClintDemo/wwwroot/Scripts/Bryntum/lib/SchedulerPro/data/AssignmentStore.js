import AjaxStore from '../../Core/data/AjaxStore.js';
import AssignmentStoreMixin from '../../Scheduler/data/mixin/AssignmentStoreMixin.js';
import AssignmentModel from '../model/AssignmentModel.js';
import { ChronoAssignmentStoreMixin } from '../../Engine/quark/store/ChronoAssignmentStoreMixin.js';
import PartOfProject from './mixin/PartOfProject.js';

/**
 * @module SchedulerPro/data/AssignmentStore
 */

/**
 * A store representing a collection of assignments between events in the {@link SchedulerPro.data.EventStore} and resources
 * in the {@link SchedulerPro.data.ResourceStore}.
 *
 * This store only accepts a model class inheriting from {@link SchedulerPro.model.AssignmentModel}.
 *
 * An AssignmentStore is usually connected to a project, which binds it to other related stores (EventStore,
 * ResourceStore and DependencyStore). The project also handles references (event, resource) to related records for the
 * records in the store.
 *
 * Resolving the references happens async, records are not guaranteed to have up to date references until calculations
 * are finished. To be certain that references are resolved, call `await project.commitAsync()` after store actions. Or
 * use one of the `xxAsync` functions, such as `loadDataAsync()`.
 *
 * Using `commitAsync()`:
 *
 * ```javascript
 * assignmentStore.data = [{ eventId, resourceId }, ...];
 *
 * // references (event, resource) not resolved yet
 *
 * await assignmentStore.project.commitAsync();
 *
 * // now they are
 * ```
 *
 * Using `loadDataAsync()`:
 *
 * ```javascript
 * await assignmentStore.loadDataAsync([{ eventId, resourceId }, ...]);
 *
 * // references (event, resource) are resolved
 * ```
 *
 * @mixes SchedulerPro/data/mixin/PartOfProject
 * @mixes Scheduler/data/mixin/AssignmentStoreMixin
 * @extends Core/data/AjaxStore
 *
 * @typings Scheduler/data/AssignmentStore -> Scheduler/data/SchedulerAssignmentStore
 */
export default class AssignmentStore extends PartOfProject(AssignmentStoreMixin(ChronoAssignmentStoreMixin.derive(AjaxStore))) {

    static get defaultConfig() {
        return {
            modelClass : AssignmentModel
        };
    }

}
