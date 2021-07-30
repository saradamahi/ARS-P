import DependencyTab from './DependencyTab.js';

/**
 * @module SchedulerPro/widget/taskeditor/PredecessorsTab
 */

/**
 * A tab inside the {@link SchedulerPro.widget.SchedulerTaskEditor scheduler task editor} or
 * {@link SchedulerPro.widget.GanttTaskEditor gantt task editor} showing the predecessors of an event or task.
 *
 * The tab has the following contents by default:
 *
 * | Widget ref  | Type                                | Weight | Description                                       |
 * |-------------|-------------------------------------|--------|---------------------------------------------------|
 * | `grid`      | {@link Grid.view.Grid Grid}         | 100    | Shows predecessors  name, dependency type and lag |
 * | \> `id`*    | {@link Grid.column.Column Column}   | -      | Id column                                         |
 * | \> `name`*  | {@link Grid.column.Column Column}   | -      | Name column, linked task                          |
 * | \> `type`*  | {@link Grid.column.Column Column}   | -      | Dependency type column                            |
 * | \> `lag`*   | {@link SchedulerPro.column.DurationColumn DurationColumn} | - | Duration column                  |
 * | `toolbar`   | {@link Core.widget.Toolbar Toolbar} | -      | Control buttons in a toolbar docked to bottom     |
 * | \> `add`    | {@link Core.widget.Button Button}   | 210    | Adds a new predecessor                            |
 * | \> `remove` | {@link Core.widget.Button Button}   | 220    | Removes selected incoming dependency              |
 *
 * <sup>*</sup>Columns are kept in the grids column store, they can be customized in a similar manner as other widgets in the
 * editor:
 *
 * ```javascript
 * const scheduler = new SchedulerPro({
 *   features : {
 *     taskEdit : {
 *       items : {
 *          predecessorsTab : {
 *            items : {
 *              grid : {
 *                columns : {
 *                  // Columns are held in a store, thus it uses `data`
 *                  // instead of `items`
 *                  data : {
 *                    name : {
 *                      // Change header text for the name column
 *                      text : 'Linked to'
 *                    }
 *                  }
 *                }
 *              }
 *            }
 *          }
 *       }
 *     }
 *   }
 * });
 * ```
 *
 * @extends SchedulerPro/widget/taskeditor/DependencyTab
 * @classtype predecessorstab
 */
export default class PredecessorsTab extends DependencyTab {
    static get $name() {
        return 'PredecessorsTab';
    }

    // Factoryable type name
    static get type() {
        return 'predecessorstab';
    }

    static get configurable() {
        return {
            cls          : 'b-predecessors-tab',
            direction    : 'fromEvent',
            negDirection : 'toEvent',
            title        : 'L{DependencyTab.Predecessors}',

            /**
             * A dependent task field (`fromEvent.name`, `fromEvent.wbsCode` etc) to sort predecessors by
             * @private
             * @config {String}
             * @default
             */
            sortField : 'fromEventName',

            items : {
                grid : {
                    columns : {
                        data : {
                            id : {
                                renderer : this.makeIdRenderer('fromEvent')
                            },
                            name : {
                                field : 'fromEvent'
                            }
                        }
                    }
                }
            }
        };
    }
}

// Register this widget type with its Factory
PredecessorsTab.initClass();
