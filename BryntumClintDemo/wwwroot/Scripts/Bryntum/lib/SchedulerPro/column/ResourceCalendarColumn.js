import Column from '../../Grid/column/Column.js';
import ColumnStore from '../../Grid/data/ColumnStore.js';
import AttachToProjectMixin from '../../Scheduler/data/mixin/AttachToProjectMixin.js';
import CalendarField from '../widget/CalendarField.js';

/**
 * @module SchedulerPro/column/ResourceCalendarColumn
 */

/**
 * A column that displays (and allows user to update) the current {@link SchedulerPro.model.CalendarModel calendar} of
 * the resource.
 *
 * Default editor is a {@link SchedulerPro.widget.CalendarField CalendarField}.
 *
 * {@inlineexample schedulerpro/column/ResourceCalendarColumn.js}
 * @mixes Scheduler/data/mixin/AttachToProjectMixin
 * @extends Grid/column/Column
 * @classType resourceCalendar
 */
export default class ResourceCalendarColumn extends Column.mixin(AttachToProjectMixin) {

    //region Config

    static get $name() {
        return 'ResourceCalendarColumn';
    }

    static get type() {
        return 'resourceCalendar';
    }

    static get defaults() {
        return {
            field  : 'calendar',
            text   : 'Calendar',
            editor : {
                type         : CalendarField.type,
                clearable    : true,
                allowInvalid : false
            }
        };
    }

    //endregion

    //region Init

    attachToProject(project) {
        if (project) {
            // Store default calendar to filter out this value
            this.defaultCalendar = project.defaultCalendar;

            this.editor.store = project.calendarManagerStore;
        }
    }

    attachToResourceStore(resourceStore) {
        super.attachToResourceStore(resourceStore);

        if (resourceStore) {
            resourceStore.on({
                name    : 'resourceStore',
                update  : 'onResourceUpdate',
                thisObj : this
            });
        }
    }

    //endregion

    //region Events

    // Event rendering does not update cells when engine updates a resource, instead we do a minimal update here
    onResourceUpdate({ record, changes }) {
        const change = changes[this.field];

        if (change) {
            // Ignore "normalization" of id -> instance, wont affect our appearance
            if (typeof change.oldValue === 'string' && change.value.id === change.oldValue) {
                return;
            }
            this.refreshCell(record);
        }
    }

    //endregion

    //region Render

    renderer({ value }) {
        if (value === this.defaultCalendar) {
            return '';
        }
        else if (value && value.id) {
            const record = this.editor.store.getById(value.id);
            return record && record[this.editor.displayField] || '';
        }
        else {
            return '';
        }
    }

    //endregion

}

ColumnStore.registerColumnType(ResourceCalendarColumn);
