import Delayable from '../../Core/mixin/Delayable.js';
import ProTaskEditStm from './mixin/ProTaskEditStm.js';
import InstancePlugin from '../../Core/mixin/InstancePlugin.js';
import GridFeatureManager from '../../Grid/feature/GridFeatureManager.js';
import DomHelper from '../../Core/helper/DomHelper.js';
import Field from '../../Core/widget/Field.js';
import MessageDialog from '../../Core/widget/MessageDialog.js';
import Widget from '../../Core/widget/Widget.js';
import '../widget/GanttTaskEditor.js';
import '../widget/SchedulerTaskEditor.js';
import ObjectHelper from '../../Core/helper/ObjectHelper.js';
import { ProjectType } from '../../Engine/scheduling/Types.js';
import VersionHelper from '../../Core/helper/VersionHelper.js';

/**
 * @module SchedulerPro/feature/TaskEdit
 */

/**
 * Feature that displays a {@link SchedulerPro.widget.SchedulerTaskEditor Task editor}, allowing users to edit task data.
 * The Task editor is a popup containing tabs with fields for editing task data.
 *
 * {@inlineexample schedulerpro/feature/TaskEdit.js}
 *
 * # Customizing tabs and their widgets
 *
 * To customize tabs you can:
 *
 * * Reconfigure built in tabs by providing override configs in the {@link #config-items items} config.
 * * Remove existing tabs or add your own in the {@link #config-items items} config.
 * * Advanced: Reconfigure the whole editor widget using {@link #config-editorConfig} or replace the whole editor using {@link #config-editorClass}.
 *
 * To add extra items to a tab you need to specify {@link Core.widget.Container#config-items items} for the tab container.
 *
 * {@inlineexample schedulerpro/feature/TaskEditExtraItems.js}
 *
 * {@region Expand to see Default tabs and fields}
 *
 * The {@link SchedulerPro.widget.SchedulerTaskEditor Task editor} contains tabs by default. Each tab contains built in widgets: text fields, grids, etc.
 *
 * | Tab ref           | Type                                                                             | Text         | Weight | Description                                                                          |
 * |-------------------|----------------------------------------------------------------------------------|--------------|--------|--------------------------------------------------------------------------------------|
 * | `generalTab`      | {@link SchedulerPro.widget.taskeditor.SchedulerGeneralTab SchedulerGeneralTab}   | General      | 100    | Shows basic configuration: name, resources, start/end dates, duration, percent done. |
 * | `predecessorsTab` | {@link SchedulerPro.widget.taskeditor.PredecessorsTab PredecessorsTab}           | Predecessors | 200    | Shows a grid with incoming dependencies                                              |
 * | `successorsTab`   | {@link SchedulerPro.widget.taskeditor.SuccessorsTab SuccessorsTab}               | Successors   | 300    | Shows a grid with outgoing dependencies                                              |
 * | `advancedTab`     | {@link SchedulerPro.widget.taskeditor.SchedulerAdvancedTab SchedulerAdvancedTab} | Advanced     | 500    | Shows advanced configuration: constraints and manual scheduling mode                 |
 * | `notesTab`        | {@link SchedulerPro.widget.taskeditor.NotesTab NotesTab}                         | Notes        | 600    | Shows a text area to add notes to the selected task                                  |
 *
 * ### General tab
 *
 * General tab contains fields for basic configurations
 *
 * | Field ref          | Type                                            | Text       | Weight | Description                                           |
 * |--------------------|-------------------------------------------------|------------|--------|-------------------------------------------------------|
 * | `nameField`        | {@link Core.widget.TextField TextField}         | Name       | 100    | Task name                                             |
 * | `resourcesField`   | {@link Core.widget.Combo Combo}                 | Resources  | 200    | Shows a list of available resources for this task     |
 * | `startDateField`   | {@link Core.widget.DateTimeField DateTimeField} | Start      | 300    | Shows when the task begins                            |
 * | `endDateField`     | {@link Core.widget.DateTimeField DateTimeField} | Finish     | 400    | Shows when the task ends                              |
 * | `durationField`    | {@link Core.widget.DurationField DurationField} | Duration   | 500    | Shows how long the task is                            |
 * | `percentDoneField` | {@link Core.widget.NumberField NumberField}     | % Complete | 600    | Shows what part of task is done already in percentage |
 *
 * ### Predecessors tab
 *
 * Predecessors tab contains a grid with incoming dependencies and controls to remove/add dependencies
 *
 * | Widget ref | Type                                | Weight | Description                                                                                      |
 * |------------|-------------------------------------|--------|--------------------------------------------------------------------------------------------------|
 * | `grid`     | {@link Grid.view.Grid Grid}         | 100    | Shows predecessors task name, dependency type and lag                                            |
 * | `toolbar`  | {@link Core.widget.Toolbar Toolbar} | 200    | Shows control buttons                                                                            |
 * | \>`add`    | {@link Core.widget.Button Button}   | 210    | Adds a new dummy predecessor. Then need to select a task from the list in the name column editor |
 * | \>`remove` | {@link Core.widget.Button Button}   | 220    | Removes selected incoming dependency                                                             |
 *
 * \> - nested items
 *
 * ### Successors tab
 *
 * Successors tab contains a grid with outgoing dependencies and controls to remove/add dependencies
 *
 * | Widget ref | Type                                | Weight | Description                                                                                    |
 * |------------|-------------------------------------|--------|------------------------------------------------------------------------------------------------|
 * | `grid`     | {@link Grid.view.Grid Grid}         | 100    | Shows successors task name, dependency type and lag                                            |
 * | `toolbar`  | {@link Core.widget.Toolbar Toolbar} | 200    | Shows control buttons                                                                          |
 * | \>`add`    | {@link Core.widget.Button Button}   | 210    | Adds a new dummy successor. Then need to select a task from the list in the name column editor |
 * | \>`remove` | {@link Core.widget.Button Button}   | 220    | Removes selected outgoing dependency                                                           |
 *
 * \> - nested items
 *
 * ### Advanced tab
 *
 * Advanced tab contains additional task scheduling options
 *
 * | Field ref                | Type                                                                  | Weight | Description                                                                             |
 * |--------------------------|-----------------------------------------------------------------------|--------|-----------------------------------------------------------------------------------------|
 * | `calendarField`          | {@link SchedulerPro.widget.CalendarField CalendarField}               | 100    | Shows a list of available calendars for this task. Shown when calendars are downloaded. |
 * | `constraintTypeField`    | {@link SchedulerPro.widget.ConstraintTypePicker ConstraintTypePicker} | 200    | Shows a list of available constraints for this task                                     |
 * | `constraintDateField`    | {@link Core.widget.DateField DateField}                               | 300    | Shows a date for the selected constraint type                                           |
 * | `manuallyScheduledField` | {@link Core.widget.Checkbox Checkbox}                                 | 400    | If checked, the task is not considered in scheduling                                    |
 *
 * ### Notes tab
 *
 * Notes tab contains a text area to show notes
 *
 * | Field ref   | Type                                            | Weight | Description                                     |
 * |-------------|-------------------------------------------------|--------|-------------------------------------------------|
 * | `noteField` | {@link Core.widget.TextAreaField TextAreaField} | 100    | Shows a text area to add text notes to the task |
 *
 * {@endregion}
 *
 * ## Removing a built in item
 *
 * To remove a built in tab or field, specify its `ref` as `false` in the `items` config:
 *
 * ```javascript
 * const scheduler = new SchedulerPro({
 *     features : {
 *         taskEdit : {
 *             items : {
 *                 generalTab      : {
 *                     items : {
 *                         // Remove "Duration" and "% Complete" fields in the "General" tab
 *                         durationField    : false,
 *                         percentDoneField : false
 *                     }
 *                 },
 *                 // Remove all tabs except the "General" tab
 *                 notesTab        : false,
 *                 predecessorsTab : false,
 *                 successorsTab   : false,
 *                 advancedTab     : false
 *             }
 *         }
 *     }
 * })
 * ```
 *
 * ## Customizing a built in item
 *
 * To customize a built in tab or field, use its `ref` as the key in the `items` config and specify the configs you want
 * to change (they will be merged with the tabs or fields default configs correspondingly):
 *
 * ```javascript
 * const scheduler = new SchedulerPro({
 *     features : {
 *         taskEdit : {
 *             items : {
 *                 generalTab      : {
 *                     // Rename "General" tab
 *                     title : 'Main',
 *                     items : {
 *                         // Rename "% Complete" field
 *                         percentDoneField : {
 *                             label : 'Status'
 *                         }
 *                     }
 *                 }
 *             }
 *         }
 *     }
 * })
 * ```
 *
 * ## Adding a custom item
 *
 * To add a custom tab or field, add an entry to the `items` config. When you add a field,
 * the `name` property links the input field to a field in the loaded task record:
 *
 * ```javascript
 * const scheduler = new SchedulerPro({
 *     features : {
 *         taskEdit : {
 *             items : {
 *                 generalTab : {
 *                     items : {
 *                         // Add new field to the last position
 *                         newGeneralField : {
 *                             type   : 'textfield',
 *                             weight : 610,
 *                             label  : 'New field in General Tab',
 *                             // Name of the field matches data field name, so value is loaded/saved automatically
 *                             name   : 'custom'
 *                         }
 *                     }
 *                 },
 *                 // Add a custom tab to the first position
 *                 newTab     : {
 *                     // Tab is a FormTab by default
 *                     title  : 'New tab',
 *                     weight : 90,
 *                     items  : {
 *                         newTabField : {
 *                             type   : 'textfield',
 *                             weight : 10,
 *                             label  : 'New field in New Tab',
 *                             // Name of the field matches data field name, so value is loaded/saved automatically.
 *                             // In this case it is equal to the Task "name" field.
 *                             name   : 'name'
 *                         }
 *                     }
 *                 }
 *             }
 *         }
 *     }
 * })
 * ```
 *
 * To turn off the Task Editor just simple disable the feature.
 *
 * ```javascript
 * const scheduler = new SchedulerPro({
 *     features : {
 *         taskEdit : false
 *     }
 * })
 * ```
 *
 * By default predecessors and successors in successorsTab and predecessorsTab are displayed using task id and a name.
 *  The id part is configurable, any task field may be used instead (for example wbsCode or sequence number)
 * by Gantt `dependencyIdField` property, to set it globally, or using
 *  taskEdit config {@link SchedulerPro/widget/TaskEditorBase#config-dependencyIdField} to set format only for taskEditor.
 * ```javascript
 * const gantt = new Gantt({
 *    dependencyIdField: 'wbsCode', // for global format
 *
 *    project,
 *    columns : [
 *        { type : 'name', width : 250 }
 *    ],
 *    features : {
 *         taskEdit : {
 *             editorConfig : {
 *                 dependencyIdField : 'wbsCode' // set only for taskEditor
 *             }
 *         }
 *     }
 * });
 * ```
 *

 *
 * For more info on customizing the Task Editor, please see Guides/Customization/Customize task editor
 *
 * @extends Core/mixin/InstancePlugin
 * @mixes SchedulerPro/feature/mixin/ProTaskEditStm
 * @mixes Core/mixin/Delayable
 * @demo taskeditor
 * @classtype taskEdit
 * @feature
 */
export default class TaskEdit extends InstancePlugin.mixin(
    Delayable,
    ProTaskEditStm
) {

    //region Events
    /**
     * Fires on the owning Scheduler instance before a task is displayed in the editor.
     * This may be listened to in order to take over the task editing flow. Returning `false`
     * stops the default editing UI from being shown.
     * @event beforeTaskEdit
     * @on-owner
     * @param {SchedulerPro.view.SchedulerPro} source The Scheduler Pro instance
     * @param {SchedulerPro.feature.TaskEdit} taskEdit The taskEdit feature
     * @param {SchedulerPro.model.EventModel} taskRecord The task about to be shown in the editor.
     * @param {HTMLElement} taskElement The element which represents the task
     * @preventable
     */

    /**
     * Fires on the owning Scheduler when the editor for an event is available but before it is shown. Allows
     * manipulating fields etc.
     * @event beforeTaskEditShow
     * @on-owner
     * @param {SchedulerPro.view.SchedulerPro} source The SchedulerPro instance
     * @param {SchedulerPro.feature.TaskEdit} taskEdit The taskEdit feature
     * @param {SchedulerPro.model.EventModel} taskRecord The task about to be shown in the editor.
     * @param {HTMLElement} eventElement The element which represents the task
     * @param {SchedulerPro.widget.TaskEditorBase} editor The editor
     */

    /**
     * Fires on the owning Scheduler Pro instance before a task is saved
     * @event beforeTaskSave
     * @on-owner
     * @param {SchedulerPro.view.SchedulerPro} source The Scheduler Pro instance
     * @param {SchedulerPro.model.EventModel} taskRecord The task about to be saved
     * @param {SchedulerPro.widget.TaskEditorBase} editor The editor widget
     * @preventable
     */

    /**
     * Fires on the owning Scheduler Pro instance after a task is saved
     * @event afterTaskSave
     * @on-owner
     * @param {SchedulerPro.view.SchedulerPro} source The Scheduler Pro instance
     * @param {SchedulerPro.model.EventModel} taskRecord The task about to be saved
     * @param {SchedulerPro.widget.TaskEditorBase} editor The editor widget
     */

    /**
     * Fires on the owning Scheduler Pro before a task is deleted, return `false` to prevent it.
     * @event beforeTaskDelete
     * @on-owner
     * @param {SchedulerPro.view.SchedulerPro} source The Scheduler Pro instance.
     * @param {SchedulerPro.model.EventModel} taskRecord The record about to be deleted
     * @param {SchedulerPro.widget.TaskEditorBase} editor The editor widget
     * @preventable
     */

    /**
     * Fires on the owning Scheduler Pro instance before an event record is saved
     * @event beforeEventSave
     * @on-owner
     * @param {SchedulerPro.view.SchedulerPro} source The Scheduler Pro instance
     * @param {SchedulerPro.model.EventModel} eventRecord The event record about to be saved
     * @param {SchedulerPro.widget.TaskEditorBase} editor The editor widget
     * @preventable
     */

    /**
     * Fires on the owning Scheduler Pro instance after an event record is saved
     * @event afterEventSave
     * @on-owner
     * @param {SchedulerPro.view.SchedulerPro} source The Scheduler Pro instance
     * @param {SchedulerPro.model.EventModel} eventRecord The event record about to be saved
     * @param {SchedulerPro.widget.TaskEditorBase} editor The editor widget
     */

    /**
     * Fires on the owning Scheduler Pro before an event record is deleted, return `false` to prevent it.
     * @event beforeEventDelete
     * @on-owner
     * @param {SchedulerPro.view.SchedulerPro} source The Scheduler Pro instance.
     * @param {SchedulerPro.model.EventModel} eventRecord The event record about to be deleted
     * @param {SchedulerPro.widget.TaskEditorBase} editor The editor widget
     * @preventable
     */
    //endregion

    //region Config

    static get $name() {
        return 'TaskEdit';
    }

    static get pluginConfig() {
        return {
            chain  : ['getEventMenuItems', 'onEventEnterKey'],
            assign : ['editEvent']
        };
    }

    static get defaultConfig() {
        return {
            /**
             * The event that shall trigger showing the editor. Defaults to `eventdblclick`, set to `` or null to disable editing of existing events.
             * @config {String}
             * @default
             * @category Editor
             */
            triggerEvent : 'eventdblclick',

            /**
             * Project type to editor class map. Editor will be used depending on project, not on product.
             *
             * @config {Object}
             * @internal
             * @category Editor
             */
            editorClassMap : {
                [ProjectType.SchedulerBasic] : 'schedulertaskeditor',
                [ProjectType.SchedulerPro]   : 'schedulertaskeditor',
                [ProjectType.Gantt]          : 'gantttaskeditor'
            },

            /**
             * Class to use as the editor. By default it picks editor class depending on the project type.
             * It can be either {@link SchedulerPro.widget.SchedulerTaskEditor SchedulerTaskEditor} or
             * {@link SchedulerPro.widget.GanttTaskEditor GanttTaskEditor}.
             * By specifying your own `editorClass` you override this.
             * @config {Core.widget.Widget}
             * @category Editor
             */
            editorClass : null,

            /**
             * A configuration object applied to the internal {@link SchedulerPro.widget.TaskEditorBase TaskEditor}.
             * Useful to for example change the title of the editor or to set its dimensions in code:
             *
             * ```javascript
             * features : {
             *     taskEdit : {
             *         editorConfig : {
             *             title : 'My title',
             *             height : 300
             *         }
             *     }
             * }
             * ```
             *
             * NOTE: The easiest approach to affect editor contents is to use the {@link #config-items items config}.
             *
             *  @config {Object}
             */
            editorConfig : null,

            /**
             * Deprecated, use {@link #config-editorConfig} instead:
             * ```javascript
             * const scheduler = new SchedulerPro({
             *     features : {
             *         taskEdit : {
             *             editorConfig : {
             *                 bbar : {
             *                     items : {
             *                         deleteButton : false
             *                     }
             *                 }
             *             }
             *         }
             *     }
             * });
             * ```
             * @config {Boolean}
             * @default
             * @category Editor widgets
             * @deprecated 5.0.0 Removed in favor of using {@link #config-editorConfig}
             */
            showDeleteButton : null,

            /**
             * True to show a confirmation dialog before deleting the event
             * @config {Boolean}
             * @default
             * @category Editor widgets
             */
            confirmDelete : true,

            /**
             * True to save and close this panel if ENTER is pressed in one of the input fields inside the panel.
             * @config {Boolean}
             * @default
             * @category Editor
             */
            saveAndCloseOnEnter : true,

            /**
             * The week start day used in all date fields of the feature editor form by default.
             * 0 means Sunday, 6 means Saturday.
             * Defaults to the locale's week start day.
             * @config {Number}
             */
            weekStartDay : null
        };
    }

    static get configurable() {
        return {
            /**
             * A configuration object used to customize the contents of the task editor. Supply a config object or
             * boolean per tab (listed below) to either affects its contents or toggle it on/off.
             *
             * Supplied config objects will be merged with the tabs predefined configs.
             *
             * Built-in tab names are:
             *  * generalTab
             *  * predecessorsTab
             *  * successorsTab
             *  * advancedTab
             *  * notesTab
             *
             *  ```
             *  features : {
             *      taskEdit : {
             *          items : {
             *              // Custom settings and additional items for the general tab
             *              generalTab : {
             *                  title : 'Common',
             *                  items : {
             *                      durationField : false,
             *                      myCustomField : {
             *                          type : 'text',
             *                          name : 'color'
             *                      }
             *                  }
             *              },
             *              // Hide the advanced tab
             *              advancedTab : false
             *          }
             *      }
             *  }
             *  ```
             *
             *  Please see the `taskeditor` demo for a customized editor in action.
             *  @config {Object}
             */
            items : null
        };
    }

    //endregion

    //region Constructor/Destructor

    construct(scheduler, config) {
        scheduler.taskEdit = this;

        super.construct(scheduler, ObjectHelper.assign({
            weekStartDay : scheduler.weekStartDay
        }, config));

        scheduler.on({
            [this.triggerEvent] : 'onActivateEditor',
            readOnly            : 'onClientReadOnlyToggle',
            dragCreateEnd       : 'onDragCreateEnd',
            thisObj             : this
        });
    }

    doDestroy() {
        this.detachFromProject();

        this.editor?.destroy();

        if (this.deleteConfirmationPromise) {
            MessageDialog.hide();
        }

        super.doDestroy();
    }

    //endregion

    //region Internal

    onClientReadOnlyToggle({ readOnly }) {
        if (this.editor) {
            this.editor.readOnly = readOnly;
        }
    }

    get scheduler() {
        return this.client;
    }

    getElementFromTaskRecord(taskRecord, resourceRecord) {
        return this.client.getElementFromEventRecord(taskRecord, resourceRecord);
    }

    scrollEventIntoView(eventRecord, resourceRecord) {
        this.client.scrollResourceEventIntoView(resourceRecord, eventRecord);
    }

    get isValid() {
        return this.editor.eachWidget(widget => {
            if (widget.isValid === true || widget.hidden || widget.disabled || (widget instanceof Field && !widget.name)) {
                return true;
            }

            return widget.isValid !== false;
        }, true);
    }

    //endregion

    //region Project

    get project() {
        return this.scheduler.project;
    }

    attachToProject() {
        this.detachFromProject();

        this.project.on({
            name      : 'project',
            loadstart : () => this.save(),
            dataReady : 'onDataReady',
            thisObj   : this
        });
    }

    detachFromProject() {
        this.detachListeners('project');
    }

    //endregion

    onDataReady() {
        const { record } = this;

        // Record could've been removed from project
        if (record?.project && this.scheduler.taskStore.includes(record)) {
            this.load(record, true);
        }
        else {
            this.editor.close();
        }
    }

    //region Editor

    /**
     * Returns true if the editor is currently active
     * @readonly
     * @property {Boolean}
     */
    get isEditing() {
        return !!this._editing;
    }

    onActivateEditor({ eventRecord, resourceRecord, eventElement }) {
        this.editEvent(eventRecord, resourceRecord, eventElement);
    }

    /**
     * Shows a {@link SchedulerPro.widget.SchedulerTaskEditor scheduler task editor} or {@link SchedulerPro.widget.GanttTaskEditor gantt task editor}
     * to edit the passed task. This function is exposed on the Scheduler Pro instance and can be called as `scheduler.editTask()`.
     * @param {SchedulerPro.model.EventModel|Function} taskRecord Task to edit or a function returning a task to edit,
     * the function will be executed within an STM transaction which will be canceled in case user presses Cancel button
     * or closes editor w/o hitting Save.
     * @param {SchedulerPro.model.ResourceModel} [resourceRecord] The Resource record for the event. This parameter is
     * required if the event is newly created for a resource and has not been assigned, or when using multi assignment.
     * @param {HTMLElement} [element] Element to anchor editor to (defaults to events element)
     * @return {Promise} Promise which resolves after the editor is shown
     * @async
     */
    async editEvent(taskRecord, resourceRecord = null, element = null) {
        const
            me            = this,
            { scheduler } = me;

        // If we are editing, cancel the edit.
        if (me.isEditing) {
            me.cancel();
        }

        // We may have just canceled the edit above, or some other user gesture may
        // have begun canceling prior to that.
        // Either way, we must wait for it to cancel before the new edit can begin.
        if (me._canceling) {
            await me._canceling;
        }

        if (!resourceRecord) {
            // In case of assignments, take the first resource
            resourceRecord = taskRecord.resource || taskRecord.resources?.[0];
        }

        if (!me.disabled) {
            const { taskStore } = scheduler;
            let isEditingNewRecord;

            me._editing = true;

            me.captureStm();
            me.startStmTransaction();

            scheduler.project.suspendAutoSync();

            if (typeof taskRecord === 'function') {
                taskRecord = taskRecord();
            }

            // If this is a new record, add it to the store and assign to a resource only after we have started a transaction
            // which can be rolled back in case of Cancel button press
            if (!taskRecord.isOccurrence && !taskStore.includes(taskRecord)) {
                isEditingNewRecord = true;

                taskStore.add(taskRecord);

                if (resourceRecord) {
                    scheduler.assignmentStore.assignEventToResource(taskRecord, resourceRecord);
                }
                await scheduler.project.commitAsync();
            }

            // For programmatic edit calls for an event not currently in view, scroll it into view first
            if (!element && taskStore.includes(taskRecord) && resourceRecord) {
                await me.scrollEventIntoView(taskRecord, resourceRecord);
            }

            const
                taskElement = element || DomHelper.down(
                    me.getElementFromTaskRecord(taskRecord, resourceRecord),
                    scheduler.eventInnerSelector
                ),
                editor      = me.getEditor(taskRecord);

            if (scheduler.trigger('beforeTaskEdit', {
                taskEdit : me,
                taskRecord,
                taskElement
            }) !== false) {

                // The Promise being async allows a mouseover to trigger the event tip
                // unless we add the editing class immediately.
                scheduler.element.classList.add('b-taskeditor-editing');

                scheduler.trigger('beforeTaskEditShow', {
                    taskEdit : me,
                    taskRecord,
                    taskElement,
                    editor
                });

                me.load(taskRecord);

                if (me.getEditor().widgetMap.deleteButton) {
                    me.getEditor().widgetMap.deleteButton.hidden = scheduler.readOnly || isEditingNewRecord || me.showDeleteButton === false;
                }

                me.attachToProject();

                if (editor.centered) {
                    await editor.show();
                }
                else {
                    if (taskElement) {
                        await editor.showBy({
                            target : taskElement,
                            anchor : true,
                            offset : -5
                        });
                    }
                    else {
                        // Display the editor centered in the Scheduler
                        await editor.showBy({
                            target : scheduler.element,
                            anchor : false,
                            // For records not part of the store (new ones, or filtered out ones) - center the editor
                            align  : 'c-c'
                        });
                    }
                }
            }
            else {
                await me.rejectStmTransaction();
                me.disableStm();
                me.freeStm();
                me._editing = false;
            }
        }
    }

    getEditor(taskRecord = this.record) {
        const
            me          = this,
            project     = taskRecord?.project || me.project,
            projectType = project.getType(),
            // Editor will be used depending on project, not on product
            editorType  = me.editorClass?.type || me.editorClassMap[projectType] || me.editorClassMap[ProjectType.Unknown] || 'schedulertaskeditor';

        if (!me.editor || me.editor.type !== editorType) {

            me.editor?.destroy();

            me.editor = Widget.create(ObjectHelper.merge({
                type                     : editorType,
                eventEditFeature         : me,
                weekStartDay             : me.weekStartDay,
                saveAndCloseOnEnter      : me.saveAndCloseOnEnter,
                owner                    : me.client,
                dependencyIdField        : me.editorConfig?.dependencyIdField || me.client.dependencyIdField,
                project                  : me.project,
                durationDisplayPrecision : me.client.durationDisplayPrecision,
                tabPanelItems            : me.items,
                listeners                : {
                    cancel  : 'onCancel',
                    delete  : 'onDelete',
                    save    : 'onSave',
                    thisObj : me
                },
                // For backward compatibility
                tabsConfig : me.tabsConfig
            }, me.editorConfig));
        }

        // Must set *after* construction, otherwise it becomes the default state
        // to reset readOnly back to
        me.editor.readOnly = me.client.readOnly;
        return me.editor;
    }

    //endregion

    //region Actions

    load(taskRecord, highlightChanges) {
        const
            me     = this,
            editor = me.getEditor(taskRecord);

        me._loading = true;

        me.record = taskRecord;
        editor.loadEvent(taskRecord, highlightChanges);

        me._loading = false;
    }

    async save() {
        const
            me            = this,
            { scheduler } = me;

        if (me.isEditing) {
            const editor = me.getEditor();

            if (!me.isValid || me.trigger('beforeTaskSave', {
                taskRecord : me.record,
                editor     : editor
            }) === false) {
                return;
            }

            me.detachFromProject();

            editor.beforeSave();

            me.commitStmTransaction();

            me.freeStm();

            me._editing = false;

            // afterSave to happen only after the editor is fully invisible.
            editor.close().then(() => editor.afterSave());

            scheduler.project.resumeAutoSync(true);

            scheduler.element.classList.remove('b-taskeditor-editing');

            me.trigger('afterTaskSave', { taskRecord : me.record, editor });

            scheduler.trigger('afterTaskEdit', { taskRecord : me.record, editor });
        }
    }

    // This is called by the TaskEditor's hide method prior to the super call,
    // so however it gets hidden, it will signal a cancel.
    async doCancel() {
        const
            me            = this,
            { scheduler } = me;

        if (me.isEditing) {
            me._editing = false;

            me.detachFromProject();

            const
                taskRecord = me.record,
                project    = me.project,
                editor     = me.getEditor();

            editor.beforeCancel();

            // the feature could get destroyed asynchronously
            if (me.isDestroyed) {
                return;
            }

            await me.rejectStmTransaction();

            // the feature could get destroyed asynchronously
            if (me.isDestroyed) {
                return;
            }

            me.disableStm();

            await project.propagateAsync();

            // the feature could get destroyed asynchronously
            if (me.isDestroyed) {
                return;
            }

            me.freeStm();

            editor.afterCancel();

            scheduler.project.resumeAutoSync(false);

            me.scheduler.element.classList.remove('b-taskeditor-editing');

            scheduler.trigger('taskEditCanceled', { taskRecord, editor });

            scheduler.trigger('afterTaskEdit', { taskRecord, editor });
        }
    }

    async cancel() {
        const me = this;
        return me._canceling || (me._canceling = me.doCancel().finally(() => me._canceling = undefined));
    }

    async delete() {
        const
            me     = this,
            editor = me.getEditor();

        if (me.trigger('beforeTaskDelete', { taskRecord : me.record, editor }) === false) {
            return;
        }

        me.detachFromProject();

        editor.beforeDelete();

        me.record.remove();

        me.freeStm();

        await me.project.commitAsync();

        // the feature could get destroyed asynchronously
        if (me.isDestroyed) {
            return;
        }

        me.scheduler.project.resumeAutoSync(true);

        me._editing = false;

        editor.close();

        editor.afterDelete();

        me.scheduler.element.classList.remove('b-taskeditor-editing');

        me.scheduler.trigger('afterTaskEdit', { editor });
    }

    //endregion

    //region Events

    onSave() {
        // There's might be propagation requested, so we giving the chance to start propagating
        // before we're doing save commit procedure.
        this.requestAnimationFrame(() => this.save());
    }

    onCancel() {
        // There's might be propagation requested, so we giving the chance to start propagating
        // before we're doing cancel rejection procedure.
        this.requestAnimationFrame(() => this.cancel());
    }

    async onDelete() {
        const me = this;

        if (me.confirmDelete) {
            // TODO: Ask nige about a better solution to prevent popup from closing when showing dialog
            const
                { editor } = me,
                autoClose  = editor.autoClose;

            editor.autoClose = false;

            me.deleteConfirmationPromise = MessageDialog.confirm({
                title       : 'L{TaskEdit.ConfirmDeletionTitle}',
                message     : 'L{TaskEdit.ConfirmDeletionMessage}',
                rootElement : me.rootElement
            });

            const result     = await me.deleteConfirmationPromise;

            editor.autoClose = autoClose;

            me.deleteConfirmationPromise = null;

            if (result === MessageDialog.yesButton) {
                me.delete();
            }
        }
        else {
            // There's might be propagation requested, so we giving the chance to start propagating
            // before we're doing cancel rejection procedure.
            me.requestAnimationFrame(() => me.delete());
        }
    }

    onDragCreateEnd({ newEventRecord, resourceRecord, proxyElement }) {
        if (!this.disabled) {
            // Call scheduler template method
            this.scheduler.onEventCreated(newEventRecord);
            this.editEvent(newEventRecord, resourceRecord);
        }
    }

    //endregion

    //region Context menu

    getEventMenuItems({ eventRecord, resourceRecord, items }) {
        if (!this.scheduler.readOnly) {
            items.editEvent = {
                text        : 'L{Edit task}',
                localeClass : this,
                icon        : 'b-icon b-icon-edit',
                weight      : -200,
                disabled    : this.disabled,
                onItem      : () => this.editEvent(eventRecord, resourceRecord)
            };
        }
    }

    // chained from EventNavigation
    onEventEnterKey({ assignmentRecord, eventRecord }) {
        if (assignmentRecord) {
            this.editEvent(eventRecord, assignmentRecord.resource);
        }
        else if (eventRecord) {
            this.editEvent(eventRecord, eventRecord.resource);
        }
    }

    //endregion

    // Fire 2 events with param / event name using 'task' + 'event'
    trigger(name, params) {
        if (/task/i.test(name)) {
            const
                returnValTaskRecord = this.scheduler.trigger(...arguments),
                eventEvent          = name.replace(/task/, 'event').replace(/Task/, 'Event');

            params.eventRecord = params.taskRecord;
            // RecurringEvents mixin expects there to be 'eventRecords' in the beforeEventDelete event
            params.eventRecords = [params.taskRecord];

            const returnValEventRecord = this.scheduler.trigger(eventEvent, params);

            return returnValTaskRecord && returnValEventRecord;
        }

        return super.trigger(...arguments);
    }

    get showDeleteButton() {
        return this._showDeleteButton;
    }

    set showDeleteButton(showDeleteButton) {
        VersionHelper.deprecate('SchedulerPro', '5.0.0', '`showDeleteButton` config is deprecated, in favor of `editorConfig`. Please see https://bryntum.com/docs/scheduler-pro/#guides/schedulerpro/upgrades/4.0.4.md for more information.');
        this._showDeleteButton = showDeleteButton;
    }
}

GridFeatureManager.registerFeature(TaskEdit, true, 'SchedulerPro');//, 'EventEdit');
GridFeatureManager.registerFeature(TaskEdit, false, 'ResourceHistogram');
