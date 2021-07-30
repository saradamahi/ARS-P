import ModelCombo from './ModelCombo.js';

/**
 * @module SchedulerPro/widget/CalendarField
 */

/**
 * A combo used to select the calendar for an event. This field can be seen in the {@link SchedulerPro.widget.taskeditor.AdvancedTab}
 * {@inlineexample schedulerpro/widget/CalendarField.js}
 * @extends SchedulerPro/widget/ModelCombo
 * @classtype calendarfield
 */
export default class CalendarField extends ModelCombo {

    //region Config

    static get $name() {
        return 'CalendarField';
    }

    // Factoryable type name
    static get type() {
        return 'calendarfield';
    }

    static get defaultConfig() {
        return {
            valueField   : 'id',
            displayField : 'name',
            editable     : false,

            /**
             * The store containing the calendars
             * @config {SchedulerPro.data.CalendarManagerStore}
             */
            store : null,

            listItemTpl : calendar => {
                return calendar.name || this.L('L{Default calendar}');
            },

            displayValueRenderer : c => {
                return c ? c.name : this.L('L{Default calendar}');
            }
        };
    }

    //endregion

    //region Internal

    get value() {
        return super.value;
    }

    set value(v) {
        if (v && v.isDefault && v.isDefault()) {
            v = null;
        }
        super.value = v;
    }

    //endregion

}

// Register this widget type with its Factory
CalendarField.initClass();
