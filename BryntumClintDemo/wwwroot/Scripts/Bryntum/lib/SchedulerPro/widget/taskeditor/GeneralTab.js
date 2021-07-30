import FormTab from './FormTab.js';
import '../../widget/StartDateField.js';
import '../../widget/EndDateField.js';
import '../../widget/EffortField.js';
import '../../../Core/widget/NumberField.js';

/**
 * @module SchedulerPro/widget/taskeditor/GeneralTab
 */

/**
 * A tab inside the {@link SchedulerPro.widget.SchedulerTaskEditor scheduler task editor} or
 * {@link SchedulerPro.widget.GanttTaskEditor gantt task editor} showing the general information for a task.
 *
 * | Field ref     | Type                                                      | Text       | Weight | Description                                                        |
 * |---------------|-----------------------------------------------------------|------------|--------|--------------------------------------------------------------------|
 * | `name`        | {@link Core.widget.TextField TextField}                   | Name       | 100    | Task name                                                          |
 * | `percentDone` | {@link Core.widget.NumberField NumberField}               | % Complete | 200    | Shows what part of task is done already in percentage              |
 * | `effort`      | {@link SchedulerPro.widget.EffortField EffortField}       | Effort     | 300    | Shows how much working time is required to complete the whole task |
 * | `divider`     | {@link Core.widget.Widget Widget}                         |            | 400    | Visual splitter between 2 groups of fields                         |
 * | `startDate`   | {@link SchedulerPro.widget.StartDateField StartDateField} | Start      | 500    | Shows when the task begins                                         |
 * | `endDate`     | {@link SchedulerPro.widget.EndDateField EndDateField}     | Finish     | 600    | Shows when the task ends                                           |
 * | `duration`    | {@link Core.widget.DurationField DurationField}           | Duration   | 700    | Shows how long the task is                                         |
 *
 * @extends SchedulerPro/widget/taskeditor/FormTab
 * @classtype generaltab
 */
export default class GeneralTab extends FormTab {
    static get $name() {
        return 'GeneralTab';
    }

    // Factoryable type name
    static get type() {
        return 'generaltab';
    }

    static get defaultConfig() {
        return {
            title : 'L{General}',
            cls   : 'b-general-tab',

            defaults : {
                localeClass : this
            },

            items : {
                name : {
                    type      : 'text',
                    weight    : 100,
                    required  : true,
                    label     : 'L{Name}',
                    clearable : true,
                    name      : 'name',
                    cls       : 'b-name'
                },
                percentDone : {
                    type   : 'number',
                    weight : 200,
                    label  : 'L{% complete}',
                    name   : 'renderedPercentDone',
                    cls    : 'b-percent-done b-inline',
                    flex   : '1 0 50%',
                    min    : 0,
                    max    : 100
                },
                effort : {
                    type   : 'effort',
                    weight : 300,
                    label  : 'L{Effort}',
                    name   : 'fullEffort',
                    flex   : '1 0 50%'
                },
                divider : {
                    html    : '',
                    weight  : 400,
                    dataset : {
                        text : this.L('L{Dates}')
                    },
                    cls  : 'b-divider',
                    flex : '1 0 100%'
                },
                startDate : {
                    type   : 'startdate',
                    weight : 500,
                    label  : 'L{Start}',
                    name   : 'startDate',
                    cls    : 'b-start-date b-inline',
                    flex   : '1 0 50%'
                },
                endDate : {
                    type   : 'enddate',
                    weight : 600,
                    label  : 'L{Finish}',
                    name   : 'endDate',
                    cls    : 'b-end-date',
                    flex   : '1 0 50%'
                },
                duration : {
                    type   : 'durationfield',
                    weight : 700,
                    label  : 'L{Duration}',
                    name   : 'fullDuration',
                    flex   : '.5 0',
                    cls    : 'b-inline'
                }
            }
        };
    }

    loadEvent(record) {
        const
            step         = {
                unit      : record.durationUnit,
                magnitude : 1
            },
            {
                startDate,
                endDate,
                effort
            }            = this.widgetMap;

        if (startDate) {
            startDate.step = step;
            startDate.eventRecord = record;
        }

        if (endDate) {
            endDate.step = step;
            endDate.eventRecord = record;
        }

        if (effort) {
            effort.unit = record.effortUnit;
        }

        super.loadEvent(record);
    }
}

// Register this widget type with its Factory
GeneralTab.initClass();
