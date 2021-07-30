import DateField from '../../Core/widget/DateField.js';
import DateHelper from '../../Core/helper/DateHelper.js';

/**
 * @module SchedulerPro/widget/StartDateField
 */

/**
 * Date field widget (text field + date picker) to be used together with Scheduling Engine.
 * This field adjusts time to the earliest possible time of the day based on either:
 *
 * - the event calendars (which is a combination of its own calendar and assigned resources ones) - if {@link #config-eventRecord} is provided.
 * - the project {@link SchedulerPro.model.ProjectModel#property-calendar calendar} - if {@link #config-project} is provided.
 *
 * **Please note, that either {@link #config-eventRecord} or {@link #config-project} value must be provided.**
 *
 * This field can be used as an editor for the {@link Grid.column.Column Column}.
 * It is used as the default editor for the `StartDateColumn`.
 *
 * {@inlineexample schedulerpro/widget/StartDateField.js}
 * @extends Core/widget/DateField
 * @classType startdatefield
 */
export default class StartDateField extends DateField {

    //region Config

    static get $name() {
        return 'StartDateField';
    }

    // Factoryable type name
    static get type() {
        return 'startdatefield';
    }

    // Factoryable type alias
    static get alias() {
        return 'startdate';
    }

    static get defaultConfig() {
        return {
            /**
             * Project model calendar of which should be used by the field.
             * @config {SchedulerPro.model.ProjectModel}
             */
            project     : null,
            /**
             * Event model calendars of which should be used by the field.
             * @config {SchedulerPro.model.EventModel}
             */
            eventRecord : null
        };
    }

    //endregion

    //region Internal

    get calendarProvider() {
        return this.eventRecord || this.project;
    }

    get backShiftDate() {
        const me = this;

        return me.calendarProvider.run('skipWorkingTime', me.value, false, me._step.magnitude, me._step.unit);
    }

    get forwardShiftDate() {
        const me = this;

        let result = me.calendarProvider.run('skipWorkingTime', me.value, true, me._step.magnitude, me._step.unit);

        // Need to skip non working time
        // since after the above step "result" can be set at 17:00 for example (for business calendar)
        result = result && me.calendarProvider.run('skipNonWorkingTime', result, true);

        return result;
    }

    transformTimeValue(value) {
        const { calendarProvider, keepTime } = this;

        if (calendarProvider && keepTime !== 'entered') {
            const
                startOfTheDay = DateHelper.clearTime(value),
                // search for the earliest available time for this day
                earliestTime  = calendarProvider.run('skipNonWorkingTime', startOfTheDay);

            // if it's the same day, the earliest time is found, use it
            if (DateHelper.isValidDate(earliestTime) && DateHelper.isEqual(earliestTime, startOfTheDay, 'day')) {
                return DateHelper.copyTimeValues(startOfTheDay, earliestTime);
            }
        }

        return super.transformTimeValue(value);
    }

    //endregion

}

// Register this widget type with its Factory
StartDateField.initClass();
