import DependencyTab from './DependencyTab.js';

/**
 * @module SchedulerPro/widget/taskeditor/SuccessorsTab
 */

/**
 * A tab inside the {@link SchedulerPro.widget.SchedulerTaskEditor scheduler task editor} or
 * {@link SchedulerPro.widget.GanttTaskEditor gantt task editor} showing the successors of an event or task.
 *
 * The tab has the following contents by default:
 *
 * | Widget ref  | Type                                | Weight | Description                                         |
 * |-------------|-------------------------------------|--------|-----------------------------------------------------|
 * | `grid`      | {@link Grid.view.Grid Grid}         | 100    | Shows successors task name, dependency type and lag |
 * | \> `id`*    | {@link Grid.column.Column Column}   | -      | Id column                                           |
 * | \> `name`*  | {@link Grid.column.Column Column}   | -      | Name column, linked task                            |
 * | \> `type`*  | {@link Grid.column.Column Column}   | -      | Dependency type column                              |
 * | \> `lag` *  | {@link SchedulerPro.column.DurationColumn DurationColumn} | - | Duration column                    |
 * | `toolbar`   | {@link Core.widget.Toolbar Toolbar} | -      | Control buttons in a toolbar docked to bottom       |
 * | \> `add`    | {@link Core.widget.Button Button}   | 210    | Adds a new successor                                |
 * | \> `remove` | {@link Core.widget.Button Button}   | 220    | Removes selected outgoing dependency                |
 *
 * <sup>*</sup>Columns are kept in the grids column store, they can be customized in a similar manner as other widgets in the
 * editor:
 *
 * ```javascript
 * const scheduler = new SchedulerPro({
 *   features : {
 *     taskEdit : {
 *       items : {
 *         successorsTab : {
 *           items : {
 *             grid : {
 *               columns : {
 *                 // Columns are held in a store, thus it uses `data`
 *                 // instead of `items`
 *                 data : {
 *                   name : {
 *                     // Change header text for the name column
 *                     text : 'Linked to'
 *                   }
 *                 }
 *               }
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * });
 * ```
 *
 * @extends SchedulerPro/widget/taskeditor/DependencyTab
 * @classtype successorstab
 */
export default class SuccessorsTab extends DependencyTab {
    static get $name() {
        return 'SuccessorsTab';
    }

    // Factoryable type name
    static get type() {
        return 'successorstab';
    }

    static get configurable() {
        return {
            cls          : 'b-successors-tab',
            direction    : 'toEvent',
            negDirection : 'fromEvent',
            title        : 'L{DependencyTab.Successors}',

            /**
             * A dependent task field (`toEvent.name` or `toEvent.wbsCode` etc) to sort successors by
             * @private
             * @config {String}
             * @default
             */
            sortField : 'toEventName',

            items : {
                grid : {
                    columns : {
                        data : {
                            id : {
                                renderer : this.makeIdRenderer('toEvent')
                            },
                            name : {
                                field : 'toEvent'
                            }
                        }
                    }
                }
            }
        };
    }
}

// Register this widget type with its Factory
SuccessorsTab.initClass();
