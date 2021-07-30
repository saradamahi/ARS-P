/**
 * @module SchedulerPro/widget/GanttTaskEditor
 */
import TaskEditorBase from './TaskEditorBase.js';
import './taskeditor/GeneralTab.js';
import './taskeditor/SuccessorsTab.js';
import './taskeditor/PredecessorsTab.js';
import './taskeditor/ResourcesTab.js';
import './taskeditor/AdvancedTab.js';
import './taskeditor/NotesTab.js';
import '../../Core/widget/TabPanel.js';
import VersionHelper from '../../Core/helper/VersionHelper.js';

/**
 * A subclass of {@link SchedulerPro.widget.TaskEditorBase} for Gantt projects which SchedulerPro can handle as well.
 *
 * @extends SchedulerPro/widget/TaskEditorBase
 */
export default class GanttTaskEditor extends TaskEditorBase {
    // Factoryable type name
    static get type() {
        return 'gantttaskeditor';
    }

    //region Config

    static get $name() {
        return 'GanttTaskEditor';
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
                            type   : 'generaltab',
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
                        resourcesTab : {
                            type   : 'resourcestab',
                            weight : 400
                        },
                        advancedTab : {
                            type   : 'advancedtab',
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
            VersionHelper.deprecate('Gantt', '5.0.0', '`extraItems` config is deprecated, in favor of `items` config. Please see https://bryntum.com/docs/gantt/#guides/upgrades/4.0.0.md for more information.');
        }

        return super.processWidgetConfig(widgetConfig);
    }

    startConfigure(config) {
        // Backward compatibility, see base class
        if (config.tabsConfig) {
            VersionHelper.deprecate('Gantt', '5.0.0', '`tabsConfig` config is deprecated, in favor of `items` config. Please see https://bryntum.com/docs/gantt/#guides/upgrades/4.0.0.md for more information.');
        }

        super.startConfigure(config);
    }

    //endregion

}

// Register this widget type with its Factory
GanttTaskEditor.initClass();
