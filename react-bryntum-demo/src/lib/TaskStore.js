/**
 * Custom Task store
 *
 * Taken from the original dragfromgrid example
 */
import { DateHelper, SchedulerEventStore } from '@bryntum/schedulerpro/schedulerpro.umd';
import Task from './Task.js';

export default class TaskStore extends SchedulerEventStore {
    static get defaultConfig() {
        return {
            modelClass : Task
        };
    }

    rescheduleOverlappingTasks(eventRecord) {
        if (eventRecord.resource) {
            const
                futureEvents = [],
                earlierEvents = [];

            // Split tasks into future and earlier tasks
            eventRecord.resource.events.forEach((ev) => {
                if (ev !== eventRecord) {
                    if (ev.startDate >= eventRecord.startDate) {
                        futureEvents.push(ev);
                    }
                    else {
                        earlierEvents.push(ev);
                    }
                }
            });

            futureEvents.sort((a, b) => a.startDate > b.startDate ? 1 : -1);
            earlierEvents.sort((a, b) => a.startDate > b.startDate ? -1 : 1);

            this.beginBatch();

            futureEvents.forEach((ev, i) => {
                const prev = futureEvents[i - 1] || eventRecord;

                ev.startDate = DateHelper.max(prev.endDate, ev.startDate);
            });

            // Walk backwards and remove any overlap
            [eventRecord, ...earlierEvents].forEach((ev, i, all) => {
                const prev = all[i - 1];

                if (ev.endDate > Date.now() && ev !== eventRecord && prev) {
                    ev.setEndDate(DateHelper.min(prev.startDate, ev.endDate), true);
                }
            });

            this.endBatch();
        }
    }
};
