import ObjectHelper from '../../Core/helper/ObjectHelper.js';
import Popup from '../../Core/widget/Popup.js';
import Toast from '../../Core/widget/Toast.js';
import Widget from '../../Core/widget/Widget.js';
import ReadyStatePropagator from '../widget/taskeditor/mixin/ReadyStatePropagator.js';
import '../localization/En.js';

/**
 * @module SchedulerPro/widget/TaskEditorBase
 */

/**
 * Abstract base class for Scheduler and Gantt task editors
 *
 * @extends Core/widget/Popup
 * @abstract
 */
export default class TaskEditorBase extends Popup.mixin(ReadyStatePropagator) {

    //region Config

    static get $name() {
        return 'TaskEditorBase';
    }

    static get type() {
        return 'taskeditorbase';
    }

    static get configurable() {
        return {
            localizableProperties : ['width'],

            title     : 'L{Information}',
            cls       : 'b-schedulerpro-taskeditor',
            closable  : true,
            draggable : {
                handleSelector : ':not(button,.b-field-inner)' // blacklist buttons and field inners
            },

            items : null, // overridden in subclasses

            bbar : {
                // When readOnly, child buttons are hidden
                hideWhenEmpty : true,

                defaults : {
                    localeClass : this
                },

                items : {
                    saveButton : {
                        text   : 'L{Save}',
                        color  : 'b-green',
                        weight : 100
                    },
                    deleteButton : {
                        text   : 'L{Delete}',
                        color  : 'b-gray',
                        weight : 200
                    },
                    cancelButton : {
                        text   : 'L{Object.Cancel}',
                        color  : 'b-gray',
                        weight : 300
                    }
                }
            },

            width : {
                $config : {
                    localeKey : 'L{editorWidth}'
                }
            }
        };
    }

    static get defaultConfig() {
        return {
            axisLock  : 'flexible',
            autoClose : true,
            onChange  : null,
            onCancel  : null,
            onSave    : null,
            autoShow  : false,
            // Required to save editor widget height when switching between tabs, some of which may want to stretch it
            //height    : '30em',

            scrollAction : 'realign',

            /**
             * The decimal precision to use for Duration field / columns, normally provided by the owning Scheduler´s {@link SchedulerPro.view.SchedulerPro#config-durationDisplayPrecision}
             * @config {Number}
             */
            durationDisplayPrecision : 1,

            /**
             * Config object specifying widgets for tabs in task editor. Every tab accepts array of widgets or widget configs.
             *
             * @config {Object}
             * @deprecated 5.0.0 Use `items` instead
             */
            extraItems : null,

            /**
             * A configuration object used to configure the built-in tabs or to add custom tab(s).
             * The individual configuration objects of the tabs contained in `tabsConfig`
             * are keyed by tab names and are merged with the default built-in configurations.
             *
             * @config {Object}
             * @deprecated 5.0.0 Use `items` instead
             */
            tabsConfig : null,

            tabPanelItems : null,

            defaultTabs : null,

            /**
             * A message to be shown when Engine is performing task scheduling. Localizable text is 'L{calculateMask}'. Disabled by default.
             * @config {String|null}
             * @default
             */
            calculateMask : null,

            /**
             * A delay before the {@link #config-calculateMask mask} becomes visible. This config is needed to avoid UI blinking when calculating is relatively fast.
             * Note, the mask is applied immediately and blocks the content anyway. However if the delay is set, it will be transparent. If `null`, the mask is visible immediately.
             * @config {Number|null}
             * @default
             */
            calculateMaskDelay : 100,

            localizableProperties : ['calculateMask'],

            project : null,

            /**
             * A task field (id, wbsCode, sequenceNumber etc) that will be used when displaying and editing linked tasks. Defaults to Gantt `dependencyIdField`
             * @config {String} dependencyIdField
             */
            dependencyIdField : null
        };
    }

    //endregion

    //region Internal

    // This method is called for every child widget in the task editor
    processWidgetConfig(widgetConfig) {
        if (widgetConfig.type?.includes('date') && widgetConfig.weekStartDay == null) {
            widgetConfig.weekStartDay = this.weekStartDay;
        }

        // Backward compatibility
        if (widgetConfig.ref === 'tabs' && this.extraItems) {
            const preparedItems = {};

            for (const key in this.extraItems) {
                // Lower-cased "tab" is not supported anymore
                const preparedKey = key.replace('tab', 'Tab');

                preparedItems[preparedKey] = {
                    items : Array.isArray(this.extraItems[key]) ? ObjectHelper.transformArrayToNamedObject(this.extraItems[key]) : this.extraItems[key]
                };
            }

            ObjectHelper.merge(widgetConfig.items, preparedItems);
        }

        return widgetConfig;
    }

    changeItems(items) {
        const
            // NOTE: tabsConfig is deprecated
            { tabsConfig, tabPanelItems = {} } = this,
            // Clone to not pollute config
            clonedItems                        = ObjectHelper.clone(items),
            tabPanel                           = clonedItems.find(w => w.ref === 'tabs');

        // Backward compatibility
        if (tabsConfig) {
            for (const ref in tabsConfig) {
                // Lower-cased "tab" is not supported anymore
                const preparedKey = ref.replace('tab', 'Tab');

                tabPanelItems[preparedKey] = tabsConfig[ref];
            }
        }

        ObjectHelper.merge(tabPanel.items, tabPanelItems);

        return super.changeItems(clonedItems);
    }

    afterConfigure() {
        const
            me          = this,
            widgetMap   = me.widgetMap,
            {
                cancelButton,
                deleteButton,
                saveButton
            } = me.bbar?.widgetMap || {};

        saveButton?.on('click', me.onSaveClick, me);
        cancelButton?.on('click', me.onCancelClick, me);
        deleteButton?.on('click', me.onDeleteClick, me);

        Object.values(widgetMap).forEach(widget => {
            if (widget.isDurationField) {
                widget.decimalPrecision = this.durationDisplayPrecision;
            }
            else if (widget.ref === 'startDate' || widget.ref === 'endDate') {
                widget.project = this.project;
            }
            else if (widget.ref === 'predecessorsTab' || widget.ref === 'successorsTab') {
                widget.grid.durationDisplayPrecision = this.durationDisplayPrecision;
                widget.dependencyIdField = widget.dependencyIdField || me.dependencyIdField;
            }

            if (widget.isReadyStatePropagator) {
                widget.on('readystatechange', me.onReadyStateChange, me);
            }
        });

        widgetMap.tabs.on({
            beforeActiveItemChange : 'onBeforeTabChange',
            thisObj                : me
        });
    }

    get canSave() {
        let canSave = true;

        // If widget report it can't both save and cancel then there's no reason to walk through others
        Object.values(this.widgetMap).forEach(w => {
            if (w.isReadyStatePropagator) {
                canSave = canSave && w.canSave;
            }
        });

        return canSave;
    }

    // Close, Cancel and clicking outside all lead here
    async hide() {
        this.detachListeners('project');
        this.detachListeners('eventStore');
        this._delayedAction = null;

        // Let editing feature know to cancel
        this.trigger('cancel');

        return super.hide();
    }

    // Iterates over contained fields and disables them based on the loaded record isEditable(fielName) result
    toggleFieldsDisabled(record) {
        this.eachWidget(widget => {
            if (widget.isField && widget.name) {
                const isFieldEditable = record.isEditable(widget.name);
                // skip unknown fields
                if (isFieldEditable !== undefined) {
                    widget.disabled = !record.isEditable(widget.name);
                }
            }
        });
    }

    /**
     * Loads a task model into the editor
     *
     * @param {SchedulerPro.model.EventModel} record
     */
    loadEvent(record, highlightChanges = false) {
        // Not using .record to not trigger containers record behaviour
        // TODO: Why not rely on that?
        this.loadedRecord = record;

        // iterate over fields and disable them by name
        this.toggleFieldsDisabled(record);

        this.callWidgetHook('loadEvent', record, highlightChanges);

        this.detachListeners('project');

        record.project.on({
            name         : 'project',
            beforeCommit : 'onProjectBeforeCommit',
            dataReady    : 'onProjectDataReady',
            thisObj      : this
        });

        this.detachListeners('eventStore');

        record.project.eventStore.on({
            name    : 'eventStore',
            remove  : 'onTaskRemove',
            thisObj : this
        });
    }

    callWidgetHook(name, ...args) {
        this.eachWidget(w => {
            if (typeof w[name] === 'function') {
                w[name](...args);
            }
        });
    }

    //endregion

    //region Events

    // General tab determines the height of the other tabs
    onBeforeTabChange({ source : tabs, prevActiveItem }) {
        const { generalTab } = this.widgetMap;

        if (prevActiveItem === generalTab) {
            tabs.eachWidget(tab => {
                if (tab.innerItem && tab !== generalTab) {
                    // Use the exact height, not the Widget height which rounds to element.offsetHeight
                    tab.height = generalTab.element.getBoundingClientRect().height;
                }
            }, false);
        }
    }

    onDocumentMouseDown(params) {
        const
            me                = this,
            activeCellEditing = Object.values(me.widgetMap).some(w => w._activeCellEdit);

        let action = null;

        if (activeCellEditing) {
            const { event }           = params,
                {
                    saveButton,
                    cancelButton,
                    deleteButton
                }                   = me.widgetMap,
                clickedButtonEl     = event.target.closest('button');

            // When there is a grid in a TaskEditor tab, and cell editing of the grid is in progress,
            // and you click on one of the action buttons below (save/cancel/delete), the cell editing feature catches
            // 'globaltap' event which is fired on global 'mousedown' and finishes the editing.
            // When new data is applied to the record, a new propagation begins. The task editor adds calculating mask
            // to protect the UI. Then 'click' event is fired. At this time the buttons are hovered with
            // the calculating mask and button's handlers are never called.
            // So, if tap out happens, and cell editing is in progress, and the target is one of the action buttons,
            // need to foresee the situation when the mask can block the buttons. Though closing the cell editing
            // does not guarantee that the propagation will start and the mask will appear. Therefore we clean up
            // the flags inside the handlers.

            if (clickedButtonEl) {
                switch (clickedButtonEl) {
                    case saveButton && saveButton.element:
                        action = me.onSaveClick;
                        break;
                    case cancelButton && cancelButton.element:
                        action = me.onCancelClick;
                        break;
                    case deleteButton && deleteButton.element:
                        action = me.onDeleteClick;
                        break;
                }
            }
        }

        me._delayedAction = action;

        super.onDocumentMouseDown(params);
    }

    onSaveClick() {
        const me = this;

        me._delayedAction = null;

        if (me.canSave) {
            me.trigger('save');
        }
        else {
            Toast.show({
                rootElement : me.rootElement,
                html        : me.L('L{saveError}')
            });
        }
    }

    onCancelClick() {
        this.close();
    }

    onDeleteClick() {
        this._delayedAction = null;

        this.trigger('delete');
    }

    onPropagationRequested() {
        this.trigger('requestPropagation');
    }

    onReadyStateChange({ source, canSave }) {
        this.requestReadyStateChange();

        if (!source.couldSaveTitle) {
            source.couldSaveTitle = source.title;
        }

        if (source.parent === this.widgetMap.tabs) {
            if (canSave) {
                source.tab.element.classList.remove('b-invalid');
                source.tab.icon = null;
                source.title = source.couldSaveTitle;
                source.couldSaveTitle = null;
            }
            else {
                source.tab.element.classList.add('b-invalid');
                source.tab.icon = 'b-icon-warning';
                source.title = source.couldSaveTitle;
            }
        }
    }

    onTaskRemove() {
        this.afterDelete();
    }

    onProjectBeforeCommit() {
        if (this.calculateMask) {
            this.mask({
                text      : this.calculateMask,
                showDelay : this.calculateMaskDelay
            });
        }
    }

    onProjectDataReady({ records }) {
        if (this.calculateMask) {
            this.unmask();
        }

        if (records.has(this.loadedRecord)) {
            this.callWidgetHook('afterProjectChange');
        }

        this._delayedAction && this._delayedAction();
    }

    beforeSave() {
        this.callWidgetHook('beforeSave');
    }

    afterSave() {
        this.callWidgetHook('afterSave');
    }

    beforeCancel() {
        this.callWidgetHook('beforeCancel');
    }

    afterCancel() {
        this.callWidgetHook('afterCancel');
    }

    beforeDelete() {
        this.callWidgetHook('beforeDelete');
    }

    afterDelete() {
        this.callWidgetHook('afterDelete');
    }

    onInternalKeyDown(event) {
        if (event.key === 'Enter' && this.saveAndCloseOnEnter && event.target.tagName.toLowerCase() === 'input') {
            if (event.target.matches('input')) {

                // Enter might have been pressed right after field editing so we need to process the changes (Fix for #166)
                const field = Widget.fromElement(event.target);
                if (field?.internalOnChange) {
                    field.internalOnChange();
                }
            }

            // this prevents field events so the new value would not be processed without above call to internalOnChange
            // Need to prevent this key events from being fired on whatever receives focus after the editor is hidden
            event.preventDefault();

            this.onSaveClick();
        }

        super.onInternalKeyDown(event);
    }

    //endregion

    updateReadOnly(readOnly) {
        const
            {
                deleteButton,
                saveButton,
                cancelButton,
                tabs
            } = this.widgetMap,
            {
                items : childTabs
            } = tabs;

        super.updateReadOnly(readOnly);

        if (deleteButton) {
            deleteButton.hidden = readOnly;
        }

        if (saveButton) {
            saveButton.hidden = readOnly;
        }

        if (cancelButton) {
            cancelButton.hidden = readOnly;
        }

        // All tabs are readOnly if we are readOnly
        for (let i = 0, { length } = childTabs; i < length; i++) {
            childTabs[i].readOnly = readOnly;
        }
    }
}

// Register this widget type with its Factory
TaskEditorBase.initClass();
