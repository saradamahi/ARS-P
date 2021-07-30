import AjaxStore from '../../Core/data/AjaxStore.js';
import DependencyStoreMixin from '../../Scheduler/data/mixin/DependencyStoreMixin.js';
import DependencyModel from '../model/DependencyModel.js';
import { ChronoDependencyStoreMixin } from '../../Engine/quark/store/ChronoDependencyStoreMixin.js';
import PartOfProject from './mixin/PartOfProject.js';

/**
 * @module SchedulerPro/data/DependencyStore
 */

/**
 * A store representing a collection of dependencies between events in the {@link SchedulerPro.data.EventStore}.
 *
 * This store only accepts a model class inheriting from {@link SchedulerPro.model.DependencyModel}.
 *
 * A DependencyStore is usually connected to a project, which binds it to other related stores (EventStore,
 * AssignmentStore and ResourceStore). The project also handles references (fromEvent, toEvent) to related records
 * for the records in the store.
 *
 * Resolving the references happens async, records are not guaranteed to have up to date references until calculations
 * are finished. To be certain that references are resolved, call `await project.commitAsync()` after store actions. Or
 * use one of the `xxAsync` functions, such as `loadDataAsync()`.
 *
 * Using `commitAsync()`:
 *
 * ```javascript
 * dependencyStore.data = [{ from, to }, ...];
 *
 * // references (fromEvent, toEvent) not resolved yet
 *
 * await dependencyStore.project.commitAsync();
 *
 * // now they are
 * ```
 *
 * Using `loadDataAsync()`:
 *
 * ```javascript
 * await dependencyStore.loadDataAsync([{ from, to }, ...]);
 *
 * // references (fromEvent, toEvent) are resolved
 * ```
 *
 * @mixes SchedulerPro/data/mixin/PartOfProject
 * @mixes Scheduler/data/mixin/DependencyStoreMixin
 * @extends Core/data/AjaxStore
 *
 * @typings Scheduler/data/DependencyStore -> Scheduler/data/SchedulerDependencyStore
 */
export default class DependencyStore extends PartOfProject(DependencyStoreMixin(ChronoDependencyStoreMixin.derive(AjaxStore))) {

    static get defaultConfig() {
        return {
            modelClass : DependencyModel
        };
    }

}
