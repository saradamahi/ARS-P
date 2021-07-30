import GridFeatureManager from '../../Grid/feature/GridFeatureManager.js';
import SchedulerEventResize from '../../Scheduler/feature/EventResize.js';

/**
 * @module SchedulerPro/feature/EventResize
 */

/**
 * Feature that allows resizing an event by dragging its end.
 *
 * By default it displays a tooltip with the new start and end dates, formatted using
 * {@link Scheduler.view.mixin.TimelineViewPresets#config-displayDateFormat}.
 *
 * This feature is **enabled** by default
 *
 * @externalexample schedulerpro/feature/EventResize.js
 * @extends Scheduler/feature/EventResize
 * @typings Scheduler/feature/EventResize -> Scheduler/feature/SchedulerEventResize
 * @classtype eventResize
 * @feature
 */
export default class EventResize extends SchedulerEventResize {

    static get $name() {
        return 'EventResize';
    }

    async internalUpdateRecord(context, timespanRecord) {
        // Estimate if the duration is going to be changed after update
        const newDuration = timespanRecord.run('calculateProjectedDuration', context.startDate, context.endDate);

        // If duration is the same, notify the feature that event has not been updated
        if (newDuration === timespanRecord.duration) {
            return false;
        }

        // Otherwise pass the processing to the parent class
        return super.internalUpdateRecord(context, timespanRecord);
    }
}

GridFeatureManager.registerFeature(EventResize, true, 'SchedulerPro');
