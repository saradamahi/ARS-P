import Model from '../../Core/data/Model.js';
import PartOfProject from '../data/mixin/PartOfProject.js';
import { CalendarIntervalMixin } from '../../Engine/calendar/CalendarIntervalMixin.js';

/**
 * @module SchedulerPro/model/CalendarIntervalModel
 */

/**
 * This is a documentation-only class, representing an interval in the {@link SchedulerPro/model/CalendarModel calendar}
 *
 * Please refer to the [calendars guide](#guides/schedulerpro/calendars.md) for details
 */
export default class CalendarIntervalModel extends PartOfProject(CalendarIntervalMixin.derive(Model)) {

    //TODO: regions Fields and Methods should be on top otherwise they are not processed by jsdoc

    //region Fields

    /**
     * The start date of the fixed (not recurrent) time interval.
     *
     * @field {Date} startDate
     */

    /**
     * The end date of the fixed (not recurrent) time interval.
     *
     * @field {Date} endDate
     */

    /**
     * The start date of the recurrent time interval. Should be specified as any expression, recognized
     * by the excellent [later](http://bunkat.github.io/later/) library.
     *
     * @field {String} recurrentStartDate
     */

    /**
     * The end date of the recurrent time interval. Should be specified as any expression, recognized
     * by the excellent [later](http://bunkat.github.io/later/) library.
     *
     * @field {String} recurrentEndDate
     */

    /**
     * The "is working" flag, which defines what kind of interval this is - either working or non-working. Default value is `false`,
     * denoting non-working intervals.
     *
     * @field {Boolean} isWorking
     * @default false
     */

    //endregion

    //region Methods

    /**
     * Whether this interval is recurrent (both `recurrentStartDate` and `recurrentEndDate` are present and parsed correctly
     * by the `later` library).
     *
     * @method isRecurrent
     * @returns {Boolean}
     */

    /**
     * Whether this interval is static - both `startDate` and `endDate` are present.
     *
     * @method isStatic
     * @returns {Boolean}
     */

    /**
     * Returns an internal representation of the recurrent start date from the `later` library.
     *
     * @method getStartDateSchedule
     * @returns {Object}
     */

    /**
     * Returns an internal representation of the recurrent end date from the `later` library.
     *
     * @method getEndDateSchedule
     * @returns {Object}
     */

    //endregion

    //region Config

    static get $name() {
        return 'CalendarIntervalModel';
    }

    //endregion

}
