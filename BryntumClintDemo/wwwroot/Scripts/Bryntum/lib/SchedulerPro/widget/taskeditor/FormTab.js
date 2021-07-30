import EditorTab from './EditorTab.js';

/**
 * @module SchedulerPro/widget/taskeditor/FormTab
 */

/**
 * Base class for tabs that **contain fields** (form-like tabs) in {@link SchedulerPro.widget.SchedulerTaskEditor scheduler task editor} or
 * {@link SchedulerPro.widget.GanttTaskEditor gantt task editor}, such as General or Notes.
 *
 * @extends SchedulerPro/widget/taskeditor/EditorTab
 */
export default class FormTab extends EditorTab {

    static get $name() {
        return 'FormTab';
    }

    static get type() {
        return 'formtab';
    }

    static get defaultConfig() {
        return {
            layoutStyle : {
                flexFlow     : 'row wrap',
                alignItems   : 'flex-start',
                alignContent : 'flex-start'
            },

            autoUpdateRecord : true
        };
    }

    // onWidgetValueChange({ source, value, valid, userAction }) {
    //     const
    //         me                  = this,
    //         { project, record } = me,
    //         { name }            = source;
    //
    //     valid = valid !== undefined ? valid : (typeof source.isValid === 'function') ? source.isValid() : source.isValid;
    //
    //     if (!me._loading && valid && project/* && !project.isPropagating()*/ && userAction) {
    //         if (name in record) {
    //             record[name] = value;
    //         }
    //         else if (record.$[name]) {
    //             debugger;
    //             record.$[name].put(value);
    //         }
    //     }
    // }

    onFieldChange({ source, valid, userAction }) {
        if (userAction) {
            valid = valid !== undefined ? valid : (typeof source.isValid === 'function') ? source.isValid() : source.isValid;

            if (valid) {
                super.onFieldChange(...arguments);
            }
        }
    }
}

FormTab.initClass();
