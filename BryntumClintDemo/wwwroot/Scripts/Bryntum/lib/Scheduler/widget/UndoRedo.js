import Container from '../../Core/widget/Container.js';
import '../../Core/widget/Combo.js';

/**
 * @module Scheduler/widget/UndoRedo
 */

const isProjectConsumer = w => w.isProjectConsumer;

/**
 * A widget which encapsulates undo/redo functionality for the {@link Scheduler.model.ProjectModel project}
 * of a scheduling widget (`Scheduler`, `Gantt` or `Calendar`).
 *
 * To make use of this, the project must be configured with a
 * {@link Scheduler.model.mixin.ProjectModelMixin#config-stm State Tracking Manager}.
 *
 * If inserted into a scheduling widget (such as into a `tbar`, or `bbar`, or as an item in a context menu),
 * the project of the encapsulating scheduling widget will be used.
 *
 * If this widget is to be used "standalone" (rendered into the DOM outside of a scheduling widget),
 * this must be configured with a reference to the project, or the scheduling widget which is
 * using the project.
 *
 * There are three child widgets encapsulated which may be referenced through the {@link Core.widget.Container#property-widgetMap}:
 *
 * - `undoBtn` - The button which operates the undo operation
 * - `transactionsCombo` - A combobox into which is pushed the list of transactions,
 * - `redoBtn` - The button which operates the redo operation
 *
 * The transactionsCombo may be configured away if only the buttons are required:
 *
 * ```javascript
 * {
 *     type      : 'undoredo',
 *     items     : {
 *         transactionsCombo : null
 *     }
 * }
 * ```
 * The example below illustrated how to embed an `undoredo` widget in the top toolbar of a Scheduler.
 * @extends Core/widget/Container
 * @classType undoredo
 * @demo Scheduler/undoredo
 * @externalexample scheduler/UndoRedo.js
 */
export default class UndoRedo extends Container {
    static get $name() {
        return 'UndoRedo';
    }

    static get type() {
        return 'undoredo';
    }

    static get configurable() {
        return {
            /**
             * The Scheduling Widget (or its `id`) whose transaction to track.
             *
             * This may be a `Scheduler`, a `Gantt` or a `Calendar`.
             *
             * ```javascript
             *     {
             *         type      : 'undoredo',
             *         scheduler : myCalendar
             *     }
             * ```
             * @config {Core.widget.Widget|String}
             */
            scheduler : null,

            /**
             * The Scheduling {@link Scheduler.model.ProjectModel project}'s whose
             * transaction to track.
             *
             * ```javascript
             *     {
             *         type    : 'undoredo',
             *         project : scheduler.project
             *     }
             * ```
             * @config {Scheduler.model.ProjectModel}
             */
            project : null,

            /**
             * Configure as `true` to show "Undo" and "Redo" as button texts. The buttons always have a tooltip
             * as a hint to the user as to their purpose.
             * @config {Boolean}
             */
            text : null,

            /**
             * Button color for the undo and redo buttons. See {@link Core.widget.Button#config-color}.
             * @config {String}
             */
            color : null,

            /**
             * Configure as `true` to show "0" badge on the undo and redo buttons when they have no actions
             * left to perform. By default when there are no actions, no badge is displayed.
             * @config {Boolean}
             */
            showZeroActionBadge : null,

            cls : 'b-undo-controls b-toolbar',

            layoutStyle : {
                alignItems : 'stretch',
                flexFlow   : 'row nowrap',
                overflow   : 'visible'
            },

            items : {
                undoBtn : {
                    type     : 'button',
                    icon     : 'b-fa-undo',
                    tooltip  : 'L{UndoRedo.UndoLastAction}',
                    disabled : true,
                    onAction : 'up.onUndo'     // 'up.' means method is on a parent Widget.
                },
                transactionsCombo : {
                    type                 : 'combo',
                    valueField           : 'idx',
                    editable             : false,
                    store                : {},
                    emptyText            : 'No items in the undo queue',
                    onAction             : 'up.onTransactionSelected',
                    displayValueRenderer : 'up.transactionsDisplayValueRenderer'
                },
                redoBtn : {
                    type     : 'button',
                    icon     : 'b-fa-redo',
                    tooltip  : 'L{UndoRedo.RedoLastAction}',
                    disabled : true,
                    onAction : 'up.onRedo'
                }
            }
        };
    }

    construct() {
        super.construct(...arguments);

        // Look up a Project owner in our ancestors.
        if (!this.stm) {
            this.scheduler = this.up(isProjectConsumer);
        }

        this.stm.on({
            recordingstop : 'updateUndoRedoControls',
            restoringstop : 'updateUndoRedoControls',
            queueReset    : 'updateUndoRedoControls',
            disabled      : 'updateUndoRedoControls',
            thisObj       : this
        });
    }

    changeItems(items) {
        const { undoBtn, redoBtn } = items;

        if (this.color) {
            undoBtn && (undoBtn.color = this.color);
            redoBtn && (redoBtn.color = this.color);
        }
        if (this.text) {
            undoBtn && (undoBtn.text = 'Undo');
            redoBtn && (redoBtn.text = 'Redo');
        }

        return super.changeItems(items);
    }

    changeScheduler(scheduler) {
        return scheduler.isProjectConsumer ? scheduler : bryntum.get(scheduler);
    }

    updateScheduler(scheduler) {
        const { crudManager } = scheduler;

        if (crudManager) {
            crudManager.on({
                load    : 'onCrudManagerLoad',
                thisObj : this
            });
        }
        // No CrudManager, so it must be inline data, so we can start immediately
        else {
            this.onCrudManagerLoad();
        }
        this.stm = scheduler.project.stm;
    }

    updateProject(project) {
        this.stm = project.stm;
    }

    async onCrudManagerLoad() {
        // Do not want normalization changes to be tracked by STM, wait until they are finished before enabling
        await this.scheduler.project.commitAsync();

        // Widget could be destroyed during async project commit
        if (!this.isDestroyed) {
            this.stm.enable();

            this.fillUndoRedoCombo();
        }
    }

    fillUndoRedoCombo() {
        // The transactionsCombo may be configured away if only undo and redo buttons are wanted
        this.widgetMap.transactionsCombo && (this.widgetMap.transactionsCombo.items = this.stm.queue.map((title, idx) => [idx, title || `Transaction ${idx}`]));
    }

    updateUndoRedoControls() {
        const
            {
                stm,
                showZeroActionBadge
            } = this,
            {
                undoBtn,
                redoBtn
            } = this.widgetMap;

        undoBtn.badge = stm.position || (showZeroActionBadge ? '0' : '');
        redoBtn.badge = (stm.length - stm.position) || (showZeroActionBadge ? '0' : '');

        undoBtn.disabled = !stm.canUndo;
        redoBtn.disabled = !stm.canRedo;

        this.fillUndoRedoCombo();
    }

    transactionsDisplayValueRenderer(record, combo) {
        const stmPos = this.stm?.position || 0;

        return `${stmPos} undo actions / ${combo.store.count - stmPos} redo actions`;
    }

    onUndo() {
        this.stm.canUndo && this.stm.undo();
    }

    onRedo() {
        this.stm.canRedo && this.stm.redo();
    }

    onTransactionSelected(combo) {
        const
            stm   = this.stm,
            value = combo.value;

        if (value >= 0) {
            if (stm.canUndo && value < stm.position) {
                stm.undo(stm.position - value);
            }
            else if (stm.canRedo && value >= stm.position) {
                stm.redo(value - stm.position + 1);
            }
        }
    }
}

UndoRedo.initClass();
