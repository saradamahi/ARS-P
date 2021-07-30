import PartOfProject from '../data/mixin/PartOfProject.js';
import DependencyBaseModel from '../../Scheduler/model/DependencyBaseModel.js';
import { SchedulerProDependencyMixin } from '../../Engine/quark/model/scheduler_pro/SchedulerProDependencyMixin.js';

/**
 * @module SchedulerPro/model/DependencyModel
 */

/**
 * This model represents a dependency between two events, usually added to a {@link SchedulerPro.data.DependencyStore}.
 *
 * It is a subclass of the {@link Scheduler.model.DependencyBaseModel} class, which in its turn subclasses
 * {@link Core.data.Model}. Please refer to documentation of those classes to become familiar with the base interface of
 * this class.
 *
 * ## Fields and references
 *
 * A Dependency has a few predefined fields, see Fields below.  The name of any fields data source can be customized in
 * the subclass, see the example below. Please also refer to {@link Core.data.Model} for details.
 *
 * ```javascript
 * class MyDependency extends DependencyModel {
 *   static get fields() {
 *     return [
 *       { name: 'to', dataSource: 'targetId' },
 *       { name: 'from', dataSource: 'sourceId' }
 *     ]);
 *   }
 * }
 * ```
 *
 * After load and project normalization, these references are accessible (assuming their respective stores are loaded):
 * - `fromEvent` - The event on the start side of the dependency
 * - `toEvent` - The event on the end side of the dependency
 *
 * ## Async resolving of references
 *
 * As described above, a dependency has links to events. These references are populated async, using the calculation
 * engine of the project that the resource via its store is a part of. Because of this asyncness, references cannot be
 * used immediately after modifications:
 *
 * ```javascript
 * dependency.from = 2;
 * // dependency.fromEvent is not yet up to date
 * ```
 *
 * To make sure references are updated, wait for calculations to finish:
 *
 * ```javascript
 * dependency.from = 2;
 * await dependency.project.commitAsync();
 * // dependency.fromEvent is up to date
 * ```
 *
 * As an alternative, you can also use `setAsync()` to trigger calculations directly after the change:
 *
 * ```javascript
 * await dependency.setAsync({ from : 2});
 * // dependency.fromEvent is up to date
 * ```
 *
 * @mixes SchedulerPro/data/mixin/PartOfProject
 * @extends Scheduler/model/DependencyBaseModel
 *
 * @typings Scheduler/model/DependencyModel -> Scheduler/model/SchedulerDependencyModel
 */
export default class DependencyModel extends PartOfProject(SchedulerProDependencyMixin.derive(DependencyBaseModel)) {

    /**
     * The calendar of the dependency used to take `lag` duration into account.
     * @field {SchedulerPro.model.CalendarModel} calendar
     */

    /**
     * Set to false to ignore this dependency in scheduling
     * @field {Boolean} active
     * @category Dependency
     */

    //region Config

    static get $name() {
        return 'DependencyModel';
    }

    static get isProDependencyModel() {
        return true;
    }

    //endregion

}
