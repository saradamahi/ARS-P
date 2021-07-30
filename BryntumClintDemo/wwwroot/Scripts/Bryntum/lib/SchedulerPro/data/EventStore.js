import AjaxStore from '../../Core/data/AjaxStore.js';
import EventStoreMixin from '../../Scheduler/data/mixin/EventStoreMixin.js';
import SharedEventStoreMixin from '../../Scheduler/data/mixin/SharedEventStoreMixin.js';
import RecurringEventsMixin from '../../Scheduler/data/mixin/RecurringEventsMixin.js';
import EventModel from '../model/EventModel.js';
import { ChronoEventStoreMixin } from '../../Engine/quark/store/ChronoEventStoreMixin.js';
import PartOfProject from './mixin/PartOfProject.js';

/**
 * @module SchedulerPro/data/EventStore
 */

/**
 * A store holding all the {@link SchedulerPro.model.EventModel events} to be rendered into a {@link SchedulerPro.view.SchedulerPro Scheduler Pro}.
 *
 * This store only accepts a model class inheriting from {@link SchedulerPro.model.EventModel}.
 *
 * An EventStore is usually connected to a project, which binds it to other related stores (AssignmentStore,
 * ResourceStore and DependencyStore). The project also handles normalization/calculation of the data on the records in
 * the store. For example if a record is added with a `startDate` and an `endDate`, it will calculate the `duration`.
 *
 * The calculations happens async, records are not guaranteed to have up to date data until they are finished. To be
 * certain that calculations have finished, call `await project.commitAsync()` after store actions. Or use one of the
 * `xxAsync` functions, such as `loadDataAsync()`.
 *
 * Using `commitAsync()`:
 *
 * ```javascript
 * eventStore.data = [{ startDate, endDate }, ...];
 *
 * // duration of the record is not yet calculated
 *
 * await eventStore.project.commitAsync();
 *
 * // now it is
 * ```
 *
 * Using `loadDataAsync()`:
 *
 * ```javascript
 * await eventStore.loadDataAsync([{ startDate, endDate }, ...]);
 *
 * // duration is calculated
 * ```
 *
 * @mixes SchedulerPro/data/mixin/PartOfProject
 * @mixes Scheduler/data/mixin/SharedEventStoreMixin
 * @mixes Scheduler/data/mixin/EventStoreMixin
 * @mixes Scheduler/data/mixin/RecurringEventsMixin
 * @extends Core/data/AjaxStore
 *
 * @typings Scheduler/data/EventStore -> Scheduler/data/SchedulerEventStore
 */
export default class EventStore extends PartOfProject(SharedEventStoreMixin(RecurringEventsMixin(EventStoreMixin(ChronoEventStoreMixin.derive(AjaxStore))))) {

    //region Config

    static get defaultConfig() {
        return {
            modelClass : EventModel
        };
    }

    //endregion

}
