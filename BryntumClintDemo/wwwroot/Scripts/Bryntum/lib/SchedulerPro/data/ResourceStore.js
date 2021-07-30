import AjaxStore from '../../Core/data/AjaxStore.js';
import ResourceStoreMixin from '../../Scheduler/data/mixin/ResourceStoreMixin.js';
import ResourceModel from '../model/ResourceModel.js';
import { ChronoResourceStoreMixin } from '../../Engine/quark/store/ChronoResourceStoreMixin.js';
import PartOfProject from './mixin/PartOfProject.js';

/**
 * @module SchedulerPro/data/ResourceStore
 */

/**
 * A store holding all the {@link SchedulerPro.model.ResourceModel resources} to be rendered into a
 * {@link SchedulerPro.view.SchedulerPro Scheduler Pro}.
 *
 * This store only accepts a model class inheriting from {@link SchedulerPro.model.ResourceModel}.
 *
 * A ResourceStore is usually connected to a project, which binds it to other related stores (EventStore,
 * AssignmentStore and DependencyStore). The project also handles references (assignments, events) to related records
 * for the records in the store.
 *
 * Resolving the references happens async, records are not guaranteed to have up to date references until calculations
 * are finished. To be certain that references are resolved, call `await project.commitAsync()` after store actions. Or
 * use one of the `xxAsync` functions, such as `loadDataAsync()`.
 *
 * Using `commitAsync()`:
 *
 * ```javascript
 * resourceStore.data = [{ id }, ...];
 *
 * // references (assignments, events) not resolved yet
 *
 * await resourceStore.project.commitAsync();
 *
 * // now they are
 * ```
 *
 * Using `loadDataAsync()`:
 *
 * ```javascript
 * await resourceStore.loadDataAsync([{ id }, ...]);
 *
 * // references (assignments, events) are resolved
 * ```
 *
 * @mixes SchedulerPro/data/mixin/PartOfProject
 * @mixes Scheduler/data/mixin/ResourceStoreMixin
 * @extends Core/data/AjaxStore
 *
 * @typings Scheduler/data/ResourceStore -> Scheduler/data/SchedulerResourceStore
 */
export default class ResourceStore extends PartOfProject(ResourceStoreMixin(ChronoResourceStoreMixin.derive(AjaxStore))) {

    static get defaultConfig() {
        return {
            modelClass : ResourceModel
        };
    }

}
