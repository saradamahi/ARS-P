import '../../../Grid/view/Grid.js';
import EditorTab from './EditorTab.js';
import '../../../Grid/column/NumberColumn.js';

/**
 * @module Gantt/widget/taskeditor/ResourcesTab
 */

/**
 * A tab inside the {@link SchedulerPro.widget.SchedulerTaskEditor scheduler task editor} or
 * {@link SchedulerPro.widget.GanttTaskEditor gantt task editor} showing the assigned resources for an event or task.
 *
 * The tab has the following contents by default:
 *
 * | Widget ref     | Type                                          | Weight | Description                            |
 * |----------------|-----------------------------------------------|--------|----------------------------------------|
 * | `grid`         | {@link Grid.view.Grid Grid}                   | 100    | Shows resource name and assigned units |
 * | \> `resource`* | {@link Grid.column.Column Column}             | -      | Name column, linked task               |
 * | \> `units`*    | {@link Grid.column.NumberColumn NumberColumn} | -      | Dependency type column                 |
 * | `toolbar`      | {@link Core.widget.Toolbar Toolbar}           | -      | Toolbar docked to bottom               |
 * | \> `add`       | {@link Core.widget.Button Button}             | 210    | Adds a new assignment                  |
 * | \> `remove`    | {@link Core.widget.Button Button}             | 220    | Removes selected assignment            |
 *
 * <sup>*</sup>Columns are kept in the grids column store, they can be customized in a similar manner as other widgets
 * in the editor:
 *
 * ```javascript
 * const scheduler = new SchedulerPro({
 *   features : {
 *     taskEdit : {
 *       items : {
 *         resourcesTab : {
 *           items : {
 *             grid : {
 *               columns : {
 *                 // Columns are held in a store, thus it uses `data`
 *                 // instead of `items`
 *                 data : {
 *                   resource : {
 *                     // Change header text for the resource column
 *                     text : 'Machine'
 *                   }
 *                 }
 *               }
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * });
 * ```
 *
 * @extends SchedulerPro/widget/taskeditor/EditorTab
 */
export default class ResourcesTab extends EditorTab {

    static get $name() {
        return 'ResourcesTab';
    }

    // Factoryable type name
    static get type() {
        return 'resourcestab';
    }

    static get configurable() {
        return {
            title : 'L{Resources}',
            cls   : 'b-resources-tab',

            layoutStyle : {
                flexFlow : 'column nowrap'
            },

            items : {
                grid : {
                    type    : 'grid',
                    weight  : 100,
                    flex    : '1 1 auto',
                    columns : {
                        data : {
                            resource : {
                                localeClass : this,
                                text        : 'L{Resource}',
                                field       : 'resource',
                                flex        : 7,
                                renderer    : ({ value }) => value?.name || '',
                                editor      : {
                                    type         : 'modelcombo',
                                    displayField : 'name',
                                    valueField   : 'id',
                                    editable     : false
                                }
                            },
                            units : {
                                type        : 'number',
                                localeClass : this,
                                text        : 'L{Units}',
                                field       : 'units',
                                flex        : 3,
                                renderer    : data => this.L('L{unitsTpl}', data),
                                min         : 0,
                                max         : 100,
                                step        : 10
                            }
                        }
                    },

                    disableGridRowModelWarning : true,
                    asyncEventSuffix           : 'PreCommit'
                },
                toolbar : {
                    type  : 'toolbar',
                    dock  : 'bottom',
                    cls   : 'b-compact-bbar',
                    items : {
                        add : {
                            type   : 'button',
                            weight : 210,
                            cls    : 'b-add-button b-green',
                            icon   : 'b-icon b-icon-add'
                        },
                        remove : {
                            type     : 'button',
                            weight   : 220,
                            cls      : 'b-remove-button b-red',
                            icon     : 'b-icon b-icon-trash',
                            disabled : true
                        }
                    }
                }
            }
        };
    }

    afterConstruct() {
        super.afterConstruct();

        const
            me           = this,
            addButton    = me.addButton = me.widgetMap.add,
            removeButton = me.removeButton = me.widgetMap.remove,
            grid         = me.grid = me.widgetMap.grid;

        addButton?.on('click', me.onAddClick, me);
        removeButton?.on('click', me.onRemoveClick, me);

        grid.on({
            selectionChange : 'onGridSelectionChange',
            startCellEdit   : 'onGridStartCellEdit',
            finishCellEdit  : 'onGridFinishCellEdit',
            cancelCellEdit  : 'onGridCancelCellEdit',
            thisObj         : me
        });
    }

    updateReadOnly(readOnly) {
        const { add, remove } = this.widgetMap;

        super.updateReadOnly(...arguments);

        // Buttons hide when we are readOnly
        add.hidden = remove.hidden = readOnly;
    }

    get resourceCombo() {
        const from = this.grid?.columns.get('resource');

        return from?.editor;
    }

    loadEvent(eventRecord) {
        const
            me           = this,
            { grid }     = me,
            firstLoad    = !grid.store.isChained,
            recordChange = !firstLoad && (eventRecord !== me.record);

        //<debug>
        console.assert(
            firstLoad || grid.store.masterStore.project === eventRecord.project,
            'Loading of a record from another project is not currently supported!'
        );
        //</debug>

        super.loadEvent(eventRecord);

        const
            { resourceCombo }                  = me,
            { assignmentStore, resourceStore } = me.project;

        // Pro does not use units on assignments
        if (!eventRecord.isTask) {
            grid.columns.get('units').hide();
        }

        if (firstLoad) {
            // Cache the mutation generation of the underlying data collection
            // so that we know when we need to refill the chained stores.
            me.assignmentStoreGeneration = assignmentStore.storage.generation;
            me.resourceStoreGeneration = resourceStore.storage.generation;

            grid.store = assignmentStore.makeChained(a => me.record && a.event === me.record, null);

            resourceCombo.store = resourceStore.makeChained(resource => {
                return (me.record && !me.record.isAssignedTo(resource)) || !me.activeAssignment || me.activeAssignment.resource === resource;
            });
        }
        else {
            // Only repopulate the chained stores if the master stores have changed
            // or if this is being loaded with a different record.
            if (recordChange || assignmentStore.storage.generation !== me.assignmentStoreGeneration) {
                grid.store.fillFromMaster();
            }
            if (recordChange || resourceStore.storage.generation !== me.resourceStoreGeneration) {
                resourceCombo.store.fillFromMaster();
            }
        }
    }

    // Returns the assignment row currently being edited
    get activeAssignment() {
        return this.grid.features.cellEdit.activeRecord;
    }

    async insertNewAssignment() {
        const
            me                = this,
            { project, grid } = me,
            assignmentStore   = project.assignmentStore;

        const [newAssignment] = assignmentStore.insert(0, {
            event    : me.record,
            resource : null,
            units    : 100
        });

        // Reset the assignment store mutation monitor when we add an assignment
        me.assignmentStoreGeneration = assignmentStore.storage.generation;
        grid.features.cellEdit.startEditing({ field : 'resource', id : newAssignment.id });

        return newAssignment;
    }

    beforeSave() {
        this.pruneInvalidAssignments();
    }

    onAddClick() {
        this.insertNewAssignment();
    }

    onRemoveClick() {
        const
            me       = this,
            { grid } = me;

        grid.store.remove(grid.selectedRecords);
        grid.selectedRecords = null;
        me.removeButton.disable();
    }

    onGridSelectionChange({ selection }) {
        this.removeButton.disabled = !(selection?.length);
    }

    onGridStartCellEdit({ editorContext }) {
        if (editorContext.column.field === 'resource') {
            this.resourceCombo.store.fillFromMaster();
            this._editingAssignment = editorContext.record;
            this._activeCellEdit = editorContext;
        }
    }

    onGridFinishCellEdit() {
        this._activeCellEdit = this._editingAssignment = null;
    }

    onGridCancelCellEdit() {
        this._activeCellEdit = this._editingAssignment = null;
    }

    pruneInvalidAssignments() {
        const { store } = this.grid;

        store.remove(store.query(a => !a.isValid));
    }
}

// Register this widget type with its Factory
ResourcesTab.initClass();
