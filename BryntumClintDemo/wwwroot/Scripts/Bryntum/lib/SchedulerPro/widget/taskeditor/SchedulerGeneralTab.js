import FormTab from './FormTab.js';
import DateHelper from '../../../Core/helper/DateHelper.js';
import '../CalendarField.js';
import '../../../Core/widget/Checkbox.js';
import '../../../Core/widget/DateTimeField.js';
import '../StartDateField.js';
import '../EndDateField.js';

/**
 * @module SchedulerPro/widget/taskeditor/SchedulerGeneralTab
 */

/**
 * A tab inside the {@link SchedulerPro.widget.SchedulerTaskEditor scheduler task editor} showing the general
 * information for an event from a simplified scheduler project.
 *
 * Contains the following fields by default:
 *
 * | Field ref          | Type                                            | Text       | Weight | Description                                                        |
 * |--------------------|-------------------------------------------------|------------|--------|--------------------------------------------------------------------|
 * | `nameField`        | {@link Core.widget.TextField TextField}         | Name       | 100    | Task name                                                          |
 * | `resourcesField`   | {@link Core.widget.Combo Combo}                 | Resources  | 200    | Shows a list of available resources for this task                  |
 * | `startDateField`   | {@link Core.widget.DateTimeField DateTimeField} | Start      | 300    | Shows when the task begins                                         |
 * | `endDateField`     | {@link Core.widget.DateTimeField DateTimeField} | Finish     | 400    | Shows when the task ends                                           |
 * | `durationField`    | {@link Core.widget.DurationField DurationField} | Duration   | 500    | Shows how long the task is                                         |
 * | `percentDoneField` | {@link Core.widget.NumberField NumberField}     | % Complete | 600    | Shows what part of task is done already in percentage              |
 *
 * To customize the tab or its fields:
 *
 * ```javascript
 * features : {
 *     taskEdit : {
 *         items : {
 *             generalTab : {
 *                 // Custom title
 *                 title: 'Common',
 *                 // Customized items
 *                 items : {
 *                     // Hide the duration field
 *                     durationField : null,
 *                     // Customize the name field
 *                     nameField : {
 *                         label : 'Title'
 *                     },
 *                     // Add a custom field
 *                     colorField : {
 *                         type   : 'text',
 *                         label  : 'Color',
 *                         // name maps to a field on the event record
 *                         name   : 'eventColor',
 *                         // place at top
 *                         weight : 0
 *                     }
 *                 }
 *             }
 *         }
 *     }
 * }
 * ```
 *
 * @extends SchedulerPro/widget/taskeditor/FormTab
 * @classtype schedulergeneraltab
 */
export default class SchedulerGeneralTab extends FormTab {
    static get $name() {
        return 'SchedulerGeneralTab';
    }

    // Factoryable type name
    static get type() {
        return 'schedulergeneraltab';
    }

    static get defaultConfig() {
        return {
            title : 'L{General}',
            cls   : 'b-general-tab',

            defaults : {
                localeClass : this,
                // New fields at the end
                weight      : 10
            },

            items : {
                nameField : {
                    type      : 'text',
                    required  : true,
                    label     : 'L{Name}',
                    clearable : true,
                    name      : 'name',
                    cls       : 'b-name',
                    weight    : 100
                },
                // TODO: Prevent removing last, or prevent event from being removed while editing
                resourcesField : {
                    type                    : 'combo',
                    label                   : 'L{Resources}',
                    name                    : 'resources',
                    editable                : true,
                    valueField              : 'id',
                    displayField            : 'name',
                    highlightExternalChange : false,
                    multiSelect             : true,
                    cls                     : 'b-resources',
                    weight                  : 200
                },
                startDateField : {
                    type      : 'datetime',
                    label     : 'L{Start}',
                    name      : 'startDate',
                    cls       : 'b-start-date',
                    flex      : '1 0 100%',
                    weight    : 300,
                    dateField : {
                        type : 'startdatefield'
                    }
                },
                endDateField : {
                    type      : 'datetime',
                    label     : 'L{Finish}',
                    name      : 'endDate',
                    cls       : 'b-end-date',
                    flex      : '1 0 100%',
                    weight    : 400,
                    dateField : {
                        type : 'enddatefield'
                    }
                },
                durationField : {
                    type   : 'durationfield',
                    label  : 'L{Duration}',
                    name   : 'fullDuration',
                    flex   : '1 0 50%',
                    cls    : 'b-duration b-inline',
                    weight : 500
                },
                percentDoneField : {
                    type   : 'number',
                    label  : 'L{% complete}',
                    name   : 'renderedPercentDone',
                    cls    : 'b-percent-done',
                    flex   : '1 0 50%',
                    min    : 0,
                    max    : 100,
                    weight : 600
                }
            }
        };
    }

    loadEvent(record) {
        const
            me                    = this,
            step                  = {
                unit      : record.durationUnit,
                magnitude : 1
            },
            { isParent, project } = record,
            {
                durationField,
                percentDoneField,
                startDateField,
                endDateField,
                resourcesField
            }                     = me.widgetMap,
            firstLoad             = !me.record;

        //<debug>
        console.assert(
            firstLoad || me.project === project,
            'Loading of a record from another project is not currently supported!'
        );
        //</debug>

        // Editing duration, percentDone & endDate disallowed for parent tasks
        if (durationField) {
            durationField.disabled = isParent;

            if (!percentDoneField) {
                durationField.element.classList.remove('b-inline');
            }
        }

        if (percentDoneField) {
            percentDoneField.disabled = isParent;
        }

        if (startDateField) {
            startDateField.dateField.eventRecord = record;
            if (DateHelper.compareUnits(step.unit, 'hour') > 0) {
                startDateField.dateField.step = step;
            }
            else {
                startDateField.timeField.step = step;
            }
        }

        if (endDateField) {
            endDateField.dateField.eventRecord = record;
            if (DateHelper.compareUnits(step.unit, 'hour') > 0) {
                endDateField.dateField.step = step;
            }
            else {
                endDateField.timeField.step = step;
            }
            endDateField.disabled = isParent;
        }

        if (resourcesField) {
            resourcesField.multiSelect = !project.eventStore.usesSingleAssignment;

            // TODO here we should set label based on multiSelect value
            //  https://github.com/bryntum/support/issues/1528

            // Can't use store directly since it may be grouped and then contains irrelevant group records
            resourcesField.store = new project.resourceStore.constructor({
                chained         : true,
                masterStore     : project.resourceStore,
                chainedFilterFn : record => !record.isSpecialRow
            });
        }

        super.loadEvent(...arguments);
    }

    onFieldChange({ source, valid, userAction, value }) {
        if (userAction && valid) {
            const
                { eventStore }     = this.record,
                resourceUnassigned = source.name === 'resources' && value.length === 0 && this.autoUpdateRecord && eventStore.removeUnassignedEvent;

            if (resourceUnassigned) {
                // Do not remove unassigned event if all resources are removed, we will do it after
                eventStore.removeUnassignedEvent = false;
            }
            super.onFieldChange(...arguments);

            if (resourceUnassigned) {
                eventStore.removeUnassignedEvent = true;
            }
        }
    }

    beforeSave() {
        // We skipped removing event on field change, if resource is still empty before save - remove record
        if (this.record.resources.length === 0 && this.record.eventStore.removeUnassignedEvent) {
            this.record.remove();
        }

        super.beforeSave();
    }
}

// Register this widget type with its Factory
SchedulerGeneralTab.initClass();
