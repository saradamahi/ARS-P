import Container from '../../../Core/widget/Container.js';
import EventLoader from './mixin/EventLoader.js';
import ReadyStatePropagator from './mixin/ReadyStatePropagator.js';

/**
 * @module SchedulerPro/widget/taskeditor/EditorTab
 */

/**
 * Base class for tabs that **do not contain fields** (non-form tabs) in {@link SchedulerPro.widget.SchedulerTaskEditor scheduler task editor} or
 * {@link SchedulerPro.widget.GanttTaskEditor gantt task editor}, such as Successors, Predecessors or Resources.
 *
 * @extends Core/widget/Container
 * @mixes SchedulerPro/widget/taskeditor/mixin/EventLoader
 */
export default class EditorTab extends Container.mixin(EventLoader, ReadyStatePropagator) {
    static get $name() {
        return 'EditorTab';
    }

    static get type() {
        return 'editortab';
    }

    static get configurable() {
        return {
            title : null
        };
    }
}
