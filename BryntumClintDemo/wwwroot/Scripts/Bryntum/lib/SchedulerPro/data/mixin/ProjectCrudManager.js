import SchedulerProjectCrudManager from '../../../Scheduler/data/mixin/ProjectCrudManager.js';
import Base from '../../../Core/Base.js';

/**
 * @module SchedulerPro/data/mixin/ProjectCrudManager
 */

// the order of the @mixes tags is important below, as the "AbstractCrudManagerMixin"
// contains the abstract methods, which are then overwritten by the concrete
// implementation in the AjaxTransport and JsonEncoder

/**
 * This mixin provides Crud manager functionality to a Scheduler Pro project.
 * The mixin turns the provided project model into a Crud manager instance.
 *
 * @mixin
 * @mixes Scheduler/data/mixin/ProjectCrudManager
 * @typings Scheduler/data/mixin/ProjectCrudManager -> Scheduler/data/mixin/SchedulerProjectCrudManager
 */
export default Target => class ProjectCrudManager extends (Target || Base).mixin(SchedulerProjectCrudManager) {

    static get properties() {
        return {
            // TODO: remove this in Gantt 4.2.0
            deprecatedProjectCalendarProperties : ['hoursPerDay', 'daysPerWeek', 'daysPerMonth']
        };
    }

    construct(...args) {
        const me = this;

        super.construct(...args);

        // add the Engine specific stores to the crud manager
        me.addPrioritizedStore(me.calendarManagerStore);
        me.addPrioritizedStore(me.assignmentStore);
        me.addPrioritizedStore(me.dependencyStore);
        me.addPrioritizedStore(me.resourceStore);
        me.addPrioritizedStore(me.eventStore);
        if (me.timeRangeStore) {
            me.addPrioritizedStore(me.timeRangeStore);
        }
        if (me.resourceTimeRangeStore) {
            me.addPrioritizedStore(me.resourceTimeRangeStore);
        }
    }

    // TODO: remove this in Gantt 4.2.0
    adjustDeprecatedResponse(response) {
        const
            projectResponse                         = response?.project,
            projectResponseCalendar                 = projectResponse?.calendar,
            { deprecatedProjectCalendarProperties } = this;

        // Some properties were move from the CalendarModel to the ProjectModel class
        // we are going to support old properties location for a while
        // to not force customers to update their backends in rush
        if (deprecatedProjectCalendarProperties && projectResponseCalendar && response.calendars) {
            // array of responded calendars to iterate
            const toProcess = response.calendars.rows?.slice() || [];

            let calendarEntry;

            while ((calendarEntry = toProcess.shift())) {
                // if that's the project calendar
                if (calendarEntry.id == projectResponseCalendar) {
                    // copy its deprecated properties to the "project"
                    deprecatedProjectCalendarProperties.forEach(property => {
                        if (!projectResponse[property] && calendarEntry[property]) {
                            // <debug>
                            console.warn(`"${property}" property was moved to the ProjectModel class. Please adjust your backend accordingly.`);
                            // </debug>
                            projectResponse[property] = calendarEntry[property];
                        }
                    });
                    break;
                }

                // add children to the list to be iterated
                calendarEntry.children && toProcess.push(...calendarEntry.children);
            }
        }

        return response;
    }

    get project() {
        return this;
    }

    set project(value) {
        super.project = value;
    }

    async applyResponse(request, response, options) {
        if (!this.isDestroyed) {
            // adjust response to support some outdated properties location
            response = this.adjustDeprecatedResponse(response);

            return super.applyResponse(request, response, options);
        }
    }

};
