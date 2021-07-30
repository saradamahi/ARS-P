/**
 * @module SchedulerPro/widget/SchedulerTaskEditor
 */
import TaskEditorBase from './TaskEditorBase.js';
import './taskeditor/SchedulerGeneralTab.js';
import './taskeditor/SuccessorsTab.js';
import './taskeditor/PredecessorsTab.js';
import './taskeditor/ResourcesTab.js';
import './taskeditor/SchedulerAdvancedTab.js';
import './taskeditor/NotesTab.js';
import VersionHelper from '../../Core/helper/VersionHelper.js';

/**
 * {@link SchedulerPro/widget/TaskEditorBase} subclass for simplified SchedulerPro projects.
 *
 * Provides a UI to edit tasks in a dialog. To append Widgets to any of the built-in tabs, use the `items` config.
 *
 * The Task editor contains tabs by default. Each tab contains built in widgets: text fields, grids, etc.
 *
 * | Tab ref           | Text                                                                             | Weight | Description                                                                          |
 * |-------------------|----------------------------------------------------------------------------------|--------|--------------------------------------------------------------------------------------|
 * | `generalTab`      | {@link SchedulerPro.widget.taskeditor.SchedulerGeneralTab SchedulerGeneralTab}   | 100    | Shows basic configuration: name, resources, start/end dates, duration, percent done. |
 * | `predecessorsTab` | {@link SchedulerPro.widget.taskeditor.PredecessorsTab PredecessorsTab}           | 200    | Shows a grid with incoming dependencies                                              |
 * | `successorsTab`   | {@link SchedulerPro.widget.taskeditor.SuccessorsTab SuccessorsTab}               | 300    | Shows a grid with outgoing dependencies                                              |
 * | `advancedTab`     | {@link SchedulerPro.widget.taskeditor.SchedulerAdvancedTab SchedulerAdvancedTab} | 500    | Shows advanced configuration: constraints and manual scheduling mode                 |
 * | `notesTab`        | {@link SchedulerPro.widget.taskeditor.NotesTab NotesTab}                         | 600    | Shows a text area to add notes to the selected task                                  |
 *
 * ## Task editor customization example
 *
 * {@inlineexample schedulerpro/feature/TaskEditExtraItems.js}
 *
 * @externalexample schedulerpro/widget/SchedulerTaskEditor.js
 * @extends SchedulerPro/widget/TaskEditorBase
 */
export default class SchedulerTaskEditor extends TaskEditorBase {
    // Factoryable type name
    static get type() {
        return 'schedulertaskeditor';
    }

    //region Config

    static get $name() {
        return 'SchedulerTaskEditor';
    }

    static get defaultConfig() {
        return {
            items : [
                {
                    type        : 'tabpanel',
                    defaultType : 'formtab',
                    ref         : 'tabs',
                    flex        : '1 0 100%',

                    layoutConfig : {
                        alignItems   : 'stretch',
                        alignContent : 'stretch'
                    },

                    items : {
                        generalTab : {
                            type   : 'schedulergeneraltab',
                            weight : 100
                        },
                        predecessorsTab : {
                            type   : 'predecessorstab',
                            weight : 200
                        },
                        successorsTab : {
                            type   : 'successorstab',
                            weight : 300
                        },
                        // Replaced with combo on general tab
                        //{ type : 'resourcestab', weight : 400 },
                        advancedTab : {
                            type   : 'scheduleradvancedtab',
                            weight : 500
                        },
                        notesTab : {
                            type   : 'notestab',
                            weight : 600
                        }
                    }
                }
            ]
        };
    }

    processWidgetConfig(widgetConfig) {
        // Backward compatibility, see base class
        if (widgetConfig.ref === 'tabs' && this.extraItems) {
            VersionHelper.deprecate('SchedulerPro', '5.0.0', '`extraItems` config is deprecated, in favor of `items` config. Please see https://bryntum.com/docs/gantt/#guides/upgrades/4.0.0.md for more information.');
        }

        return super.processWidgetConfig(widgetConfig);
    }

    startConfigure(config) {
        // Backward compatibility, see base class
        if (config.tabsConfig) {
            VersionHelper.deprecate('SchedulerPro', '5.0.0', '`tabsConfig` config is deprecated, in favor of `items` config. Please see https://bryntum.com/docs/gantt/#guides/upgrades/4.0.0.md for more information.');
        }

        super.startConfigure(config);
    }

    //endregion

}

// Register this widget type with its Factory
SchedulerTaskEditor.initClass();
