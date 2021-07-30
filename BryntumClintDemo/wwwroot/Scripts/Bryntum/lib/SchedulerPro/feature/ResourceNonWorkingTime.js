import GridFeatureManager from '../../Grid/feature/GridFeatureManager.js';
import ResourceTimeRangesBase from '../../Scheduler/feature/base/ResourceTimeRangesBase.js';
import ResourceTimeRangeModel from '../../Scheduler/model/ResourceTimeRangeModel.js';

/**
 * @module SchedulerPro/feature/ResourceNonWorkingTime
 */

/**
 * This feature is **off** by default. For info on enabling it, see {@link Grid.view.mixin.GridFeatures}.
 *
 * @extends Scheduler/feature/base/ResourceTimeRangesBase
 * @classtype resourceNonWorkingTime
 * @feature
 */
export default class ResourceNonWorkingTime extends ResourceTimeRangesBase {

    //region Config

    static get $name() {
        return 'ResourceNonWorkingTime';
    }

    static get defaultConfig() {
        return {
            idPrefix : 'resourcenonworkingtime',
            rangeCls : 'b-sch-resourcetimerange b-sch-resourcenonworkingtime'
        };
    }

    static get properties() {
        return {
            resourceMap : new Map()
        };
    }

    //endregion

    //region Constructor

    construct() {
        super.construct(...arguments);

        this.client.timeAxis.on({
            name        : 'timeAxis',
            reconfigure : 'onTimeAxisReconfigure',
            // should trigger before event rendering chain
            prio        : 100,
            thisObj     : this
        });
    }

    //endregion

    //region Init

    attachToResourceStore(resourceStore) {
        super.attachToResourceStore(resourceStore);

        if (resourceStore) {
            resourceStore.on({
                name            : 'resourceStore',
                changePreCommit : 'onResourceChange',
                thisObj         : this
            });
        }
    }

    attachToCalendarManagerStore(calendarManagerStore) {
        super.attachToCalendarManagerStore(calendarManagerStore);

        if (calendarManagerStore) {
            calendarManagerStore.on({
                name            : 'calendarManagerStore',
                changePreCommit : 'onCalendarChange',
                thisObj         : this
            });
        }
    }

    //endregion

    //region Events

    onTimeAxisReconfigure() {
        // reset ranges cache on timeAxis change
        this.resourceMap.clear();
    }

    onResourceChange({ action, records, record, changes }) {
        // Might need to redraw on update
        if (action === 'update') {
            const change = changes.calendar;

            // Ignore calendar normalization
            if (change && (typeof change.oldValue !== 'string' || change.value.id !== change.oldValue)) {
                this.resourceMap.delete(record.id);
                // Redraw row in case calendar change did not affect any events
                this.scheduler.currentOrientation.refreshRow(record);
            }
        }

        // Keep map up to date on removals (adds are handled through rendering in getEventsToRender)
        if (action === 'remove') {
            records.forEach(record => this.resourceMap.delete(record.id));
        }

        if (action === 'removeall') {
            this.resourceMap.clear();
        }
    }

    onCalendarChange({ action, records, record, changes }) {
        // TODO
    }

    //endregion

    //region Internal

    // Called on render of resources events to get events to render. Add any ranges
    // (chained function from Scheduler)
    getEventsToRender(resource, events) {
        const { resourceMap, scheduler } = this;

        if (resource.calendar) {
            if (!resourceMap.has(resource.id)) {
                const
                    ranges  = resource.calendar.getNonWorkingTimeRanges(
                        scheduler.startDate,
                        scheduler.endDate
                    ),
                    records = ranges.map((range, i) => new ResourceTimeRangeModel({
                        id           : `r${resource.id}i${i}`,
                        startDate    : range.startDate,
                        endDate      : range.endDate,
                        resourceId   : resource.id,
                        isNonWorking : true
                    }));

                resourceMap.set(resource.id, records);
            }

            events.push(...resourceMap.get(resource.id));
        }

        return events;
    }

    shouldInclude(eventRecord) {
        return eventRecord.isNonWorking;
    }

    //endregion

}

// No feature based styling needed, do not add a cls to Scheduler
ResourceNonWorkingTime.featureClass = '';

GridFeatureManager.registerFeature(ResourceNonWorkingTime, false, 'SchedulerPro');
