import TimelineBase from './TimelineBase.js';
import DateHelper from '../../Core/helper/DateHelper.js';
import DomHelper from '../../Core/helper/DomHelper.js';
import CrudManager from '../data/CrudManager.js';

import '../localization/En.js';

import SchedulerDom from './mixin/SchedulerDom.js';
import SchedulerDomEvents from './mixin/SchedulerDomEvents.js';
import SchedulerDragResize from './mixin/SchedulerDragResize.js';
import SchedulerEventRendering from './mixin/SchedulerEventRendering.js';
import SchedulerStores from './mixin/SchedulerStores.js';
import SchedulerScroll from './mixin/SchedulerScroll.js';
import SchedulerRegions from './mixin/SchedulerRegions.js';
import SchedulerState from './mixin/SchedulerState.js';
import EventSelection from './mixin/EventSelection.js';
import EventNavigation from './mixin/EventNavigation.js';
import CrudManagerView from '../crud/mixin/CrudManagerView.js';
import HorizontalRendering from './orientation/HorizontalRendering.js';
import VerticalRendering from './orientation/VerticalRendering.js';
import '../column/TimeAxisColumn.js';
import '../column/VerticalTimeAxisColumn.js';

// Should always be present in Scheduler
import '../../Grid/feature/RegionResize.js';

/**
 * @module Scheduler/view/SchedulerBase
 */

/**
 * A thin base class for {@link Scheduler.view.Scheduler}. Does not include any features by default, allowing smaller
 * custom built bundles if used in place of {@link Scheduler.view.Scheduler}.
 *
 * **NOTE:** In most scenarios you do probably want to use Scheduler instead of SchedulerBase.
 *
 * @mixes Scheduler/view/mixin/EventNavigation
 * @mixes Scheduler/view/mixin/EventSelection
 * @mixes Scheduler/view/mixin/SchedulerDom
 * @mixes Scheduler/view/mixin/SchedulerDomEvents
 * @mixes Scheduler/view/mixin/SchedulerEventRendering
 * @mixes Scheduler/view/mixin/SchedulerRegions
 * @mixes Scheduler/view/mixin/SchedulerScroll
 * @mixes Scheduler/view/mixin/SchedulerState
 * @mixes Scheduler/view/mixin/SchedulerStores
 * @mixes Scheduler/view/mixin/TimelineDateMapper
 * @mixes Scheduler/view/mixin/TimelineDomEvents
 * @mixes Scheduler/view/mixin/TimelineEventRendering
 * @mixes Scheduler/view/mixin/TimelineScroll
 * @mixes Scheduler/view/mixin/TimelineViewPresets
 * @mixes Scheduler/view/mixin/TimelineZoomable
 * @mixes Scheduler/crud/mixin/CrudManagerView
 * @mixes Scheduler/data/mixin/ProjectConsumer
 *
 * @extends Scheduler/view/TimelineBase
 */
// SchedulerDragResize not included as @mixes above on purpose, since it is private
export default class SchedulerBase extends TimelineBase.mixin(
    CrudManagerView,
    SchedulerDom,
    SchedulerDomEvents,
    SchedulerDragResize,
    SchedulerStores,
    SchedulerScroll,
    SchedulerState,
    SchedulerEventRendering,
    SchedulerRegions,
    EventSelection,
    EventNavigation
) {
    //region Config

    static get $name() {
        return 'SchedulerBase';
    }

    // Factoryable type name
    static get type() {
        return 'schedulerbase';
    }

    static get configurable() {
        return {
            /**
             * The date to display when used as a component of a Calendar.
             *
             * This is required by the Calendar Mode Interface.
             * @config {Date}
             * @internal
             */
            date : {
                value : null,

                $config : {
                    equal : 'date'
                }
            },

            /**
             * When the scheduler is used in a Calendar, this function provides the textual description for the
             * Calendar's toolbar.
             *
             * ```javascript
             *  descriptionRenderer : scheduler => {
             *      const
             *          count = scheduler.eventStore.records.filter(
             *              eventRec => DateHelper.intersectSpans(
             *                  scheduler.startDate, scheduler.endDate,
             *                  eventRec.startDate, eventRec.endDate)).length,
             *          startDate = DateHelper.format(scheduler.startDate, 'DD/MM/YYY'),
             *          endData = DateHelper.format(scheduler.endDate, 'DD/MM/YYY');
             *
             *      return `${startDate} - ${endData}, ${count} event${count === 1 ? '' : 's'}`;
             *  }
             * ```
             * @config {Function}
             * @param {Scheduler.view.SchedulerBase} view The active view.
             */
            descriptionRenderer : {
                value : null,

                $config : null,
                default : view => `${DateHelper.getLocalizedNameOfUnit('Week')} ${DateHelper.getWeekDescription(view.startDate, view.endDate)}`
            }
        };
    }

    static get defaultConfig() {
        return {
            /**
             * Scheduler mode. Supported values: horizontal, vertical
             * @config {String} mode
             * @default
             */
            mode : 'horizontal',

            /**
             * CSS class to add to rendered events
             * @config {String}
             * @category CSS
             * @private
             * @default
             */
            eventCls : 'b-sch-event',

            /**
             * CSS class to add to cells in the timeaxis column
             * @config {String}
             * @category CSS
             * @private
             * @default
             */
            timeCellCls : 'b-sch-timeaxis-cell',

            timeCellSelector : '.b-sch-timeaxis-cell',

            scheduledEventName : 'event',

            /**
             * A CSS class to apply to each event in the view on mouseover (defaults to 'b-sch-event-hover').
             * @config {String}
             * @default
             * @category CSS
             * @private
             */
            overScheduledEventClass : 'b-sch-event-hover',

            /**
             * Set to false if you don't want to allow events overlapping times for any one resource (defaults to true).
             * @config {Boolean}
             * @default
             * @category Scheduled events
             */
            allowOverlap : true,

            /**
             * The height in pixels of Scheduler rows.
             * @config {Number}
             * @default
             */
            rowHeight : 60,

            /**
             * Scheduler overrides Grids default implementation of {@link Grid.view.GridBase#config-getRowHeight} to
             * pre-calculate row heights based on events in the rows.
             *
             * The amount of rows that are pre-calculated is limited for performance reasons. The limit is configurable
             * by specifying the {@link Scheduler.view.SchedulerBase#config-preCalculateHeightLimit} config.
             *
             * The results of the calculation are cached internally.
             *
             * @config {Function} getRowHeight
             * @param {Scheduler.model.ResourceModel} getRowHeight.record Resource record to determine row height for
             * @returns {Number} Desired row height
             * @category Layout
             */

            /**
             * Maximum number of resources for which height is pre-calculated. If you have many events per
             * resource you might want to lower this number to gain some initial rendering performance.
             *
             * Specify a falsy value to opt out of row height pre-calculation.
             *
             * @config {Number}
             * @default
             * @category Layout
             */
            preCalculateHeightLimit : 10000,

            crudManagerClass : CrudManager,

            testConfig : {
                loadMaskError : {
                    autoClose : 10,
                    showDelay : 0
                }
            }
        };
    }

    static get deprecatedEvents() {
        return {
            eventContextMenuBeforeShow : {
                product            : 'Scheduler',
                invalidAsOfVersion : '5.0.0',
                message            : '`eventContextMenuBeforeShow` event is deprecated, in favor of `eventMenuBeforeShow` event. Please see https://bryntum.com/docs/scheduler/#guides/upgrades/3.1.0.md for more information.'
            },
            eventContextMenuShow : {
                product            : 'Scheduler',
                invalidAsOfVersion : '5.0.0',
                message            : '`eventContextMenuShow` event is deprecated, in favor of `eventMenuShow` event. Please see https://bryntum.com/docs/scheduler/#guides/upgrades/3.1.0.md for more information.'
            },
            eventContextMenuItem : {
                product            : 'Scheduler',
                invalidAsOfVersion : '5.0.0',
                message            : '`eventContextMenuItem` event is deprecated, in favor of `eventMenuItem` event. Please see https://bryntum.com/docs/scheduler/#guides/upgrades/3.1.0.md for more information.'
            },
            scheduleContextMenuBeforeShow : {
                product            : 'Scheduler',
                invalidAsOfVersion : '5.0.0',
                message            : '`scheduleContextMenuBeforeShow` event is deprecated, in favor of `scheduleMenuBeforeShow` event. Please see https://bryntum.com/docs/scheduler/#guides/upgrades/3.1.0.md for more information.'
            },
            scheduleContextMenuShow : {
                product            : 'Scheduler',
                invalidAsOfVersion : '5.0.0',
                message            : '`scheduleContextMenuShow` event is deprecated, in favor of `scheduleMenuShow` event. Please see https://bryntum.com/docs/scheduler/#guides/upgrades/3.1.0.md for more information.'
            },
            scheduleContextMenuItem : {
                product            : 'Scheduler',
                invalidAsOfVersion : '5.0.0',
                message            : '`scheduleContextMenuItem` event is deprecated, in favor of `scheduleMenuItem` event. Please see https://bryntum.com/docs/scheduler/#guides/upgrades/3.1.0.md for more information.'
            }
        };
    }

    //endregion

    //region Events

    /**
     * Fired after rendering an event, when its element is available in DOM.
     * @event renderEvent
     * @param {Scheduler.view.Scheduler} source This Scheduler
     * @param {Scheduler.model.EventModel} eventRecord The event record
     * @param {Scheduler.model.ResourceModel} resourceRecord The resource record
     * @param {Scheduler.model.AssignmentModel} assignmentRecord The assignment record
     * @param {Object} renderData An object containing details about the event rendering, see
     *   {@link Scheduler.view.mixin.SchedulerEventRendering#config-eventRenderer} for details
     * @param {Object} tplData DEPRECATED 4.0: Use renderData instead
     * @param {Boolean} isRepaint `true` if this render is a repaint of the event, updating its existing element
     * @param {Boolean} isReusingElement `true` if this render lead to the event reusing a released events element
     * @param {HTMLElement} element The events element
     */

    /**
     * Fired after releasing an event, useful to cleanup of custom content added on `renderEvent` or in `eventRenderer`.
     * @event releaseEvent
     * @param {Scheduler.view.Scheduler} source This Scheduler
     * @param {Scheduler.model.EventModel} eventRecord The event record
     * @param {Scheduler.model.ResourceModel} resourceRecord The resource record
     * @param {Scheduler.model.AssignmentModel} assignmentRecord The assignment record
     * @param {Object} renderData An object containing details about the event rendering
     * @param {HTMLElement} element The events element
     */

    /**
     * Fired when clicking a resource header cell
     * @event resourceHeaderClick
     * @param {Scheduler.view.Scheduler} source This Scheduler
     * @param {Scheduler.model.ResourceModel} resourceRecord The resource record
     * @param {Event} event The event
     */

    /**
     * Fired when double clicking a resource header cell
     * @event resourceHeaderDblclick
     * @param {Scheduler.view.Scheduler} source This Scheduler
     * @param {Scheduler.model.ResourceModel} resourceRecord The resource record
     * @param {Event} event The event
     */

    /**
     * Fired when activating context menu on a resource header cell
     * @event resourceHeaderContextmenu
     * @param {Scheduler.view.Scheduler} source This Scheduler
     * @param {Scheduler.model.ResourceModel} resourceRecord The resource record
     * @param {Event} event The event
     */

    //endregion

    //region Functions injected by features

    // For documentation & typings purposes

    /**
     * Opens an editor UI to edit the passed event.
     *
     * *NOTE: Only available when the {@link Scheduler/feature/EventEdit EventEdit} feature is enabled.*
     *
     * @function editEvent
     * @param {Scheduler.model.EventModel} eventRecord Event to edit
     * @param {Scheduler.model.ResourceModel} [resourceRecord] The Resource record for the event.
     * This parameter is needed if the event is newly created for a resource and has not been assigned, or when using
     * multi assignment.
     * @param {HTMLElement} [element] Element to anchor editor to (defaults to events element)
     * @category Feature shortcuts
     */

    /**
     * Returns the dependency record for a DOM element
     *
     * *NOTE: Only available when the {@link Scheduler/feature/Dependencies Dependencies} feature is enabled.*
     *
     * @function resolveDependencyRecord
     * @param {HTMLElement} element The dependency line element
     * @return {Scheduler.model.DependencyModel} The dependency record
     * @category Feature shortcuts
     */

    //endregion

    //region Init

    afterConstruct() {
        super.afterConstruct();

        if (this.createEventOnDblClick) {
            this.on('scheduledblclick', this.onSchedulerDblClick);
        }
    }

    //endregion

    //region Config getters/setters

    // Overrides TimelineBase to supply eventStore as its store (which is only used in passed events)
    set timeAxisViewModel(timeAxisViewModel) {
        super.timeAxisViewModel = timeAxisViewModel;

        if (this.eventStore) {
            this.timeAxisViewModel.eventStore = this.eventStore;
        }
    }

    get timeAxisViewModel() {
        return super.timeAxisViewModel;
    }

    // Placeholder getter/setter for mixins, please make any changes needed to SchedulerStores#store instead
    get store() {
        return super.store;
    }

    set store(store) {
        super.store = store;
    }

    //endregion

    //region Event handlers

    onLocaleChange() {
        this.currentOrientation.onLocaleChange();

        super.onLocaleChange();
    }

    onSchedulerDblClick({ date : startDate, resourceRecord, row }) {
        const me = this;

        if (me.readOnly || resourceRecord.isSpecialRow) {
            return;
        }

        me.internalAddEvent(startDate, resourceRecord, row);
    }

    onColumnsChanged({ action, changes, record : column }) {
        // TODO: Have ResourceHeader call this directly instead of relying on event?
        if (column === this.timeAxisColumn && 'width' in changes) {
            this.updateCanvasSize();
        }

        super.onColumnsChanged(...arguments);
    }

    // Only used in vertical mode
    onVerticalScroll({ scrollTop }) {
        this.currentOrientation.updateFromVerticalScroll(scrollTop);
    }

    /**
     * Called when new event is created.
     * Сan be overriden to supply default record values etc.
     * @param {Scheduler.model.EventModel} eventRecord Newly created event
     */
    onEventCreated(eventRecord) {}

    //endregion

    //region Mode

    /**
     * Checks if scheduler is in horizontal mode
     * @returns {Boolean}
     * @readonly
     * @category Common
     * @private
     */
    get isHorizontal() {
        return this.mode === 'horizontal';
    }

    /**
     * Checks if scheduler is in vertical mode
     * @returns {Boolean}
     * @readonly
     * @category Common
     * @private
     */
    get isVertical() {
        return this.mode === 'vertical';
    }

    /**
     * Get mode (horizontal/vertical)
     * @property {String}
     * @readonly
     * @category Common
     */
    get mode() {
        return this._mode;
    }

    set mode(mode) {
        const me = this;

        me._mode = mode;

        if (!me[mode]) {
            if (mode === 'horizontal') {
                me.horizontal = new HorizontalRendering(me);
                if (me.isPainted) {
                    me.horizontal.init();
                }

                me.un('scroll', me.onVerticalScroll, me);
            }
            else if (mode === 'vertical') {
                // Zooming is not yet supported in vertical mode, disable it
                me.zoomOnTimeAxisDoubleClick = me.zoomOnMouseWheel = false;

                me.vertical = new VerticalRendering(me);
                if (me.rendered) {
                    me.vertical.init();
                }

                me.on('scroll', me.onVerticalScroll, me);
            }
        }
    }

    get currentOrientation() {
        return this[this.mode];
    }

    //endregion

    //region Dom event dummies

    // this is ugly, but needed since super cannot be called from SchedulerDomEvents mixin...

    onElementKeyDown(event) {
        super.onElementKeyDown(event);
    }

    onElementKeyUp(event) {
        super.onElementKeyUp(event);
    }

    onElementMouseOver(event) {
        super.onElementMouseOver(event);
    }

    onElementMouseOut(event) {
        super.onElementMouseOut(event);
    }

    //endregion

    //region Feature hooks

    /**
     * Populates the event context menu. Chained in features to add menu items.
     * @param {Object} options Contains menu items and extra data retrieved from the menu target.
     * @param {Grid.column.Column} options.column Column for which the menu will be shown.
     * @param {Scheduler.model.EventModel} options.eventRecord The context event.
     * @param {Scheduler.model.ResourceModel} options.resourceRecord The context resource.
     * @param {Scheduler.model.AssignmentModel} options.assignmentRecord The context assignment if any.
     * @param {Object} options.items A named object to describe menu items.
     * @internal
     */
    populateEventMenu() {}

    /**
     * Populates the time axis context menu. Chained in features to add menu items.
     * @param {Object} options Contains menu items and extra data retrieved from the menu target.
     * @param {Grid.column.Column} options.column Column for which the menu will be shown.
     * @param {Scheduler.model.ResourceModel} options.resourceRecord The context resource.
     * @param {Date} options.date The Date corresponding to the mouse position in the time axis.
     * @param {Object} options.items A named object to describe menu items.
     * @internal
     */
    populateScheduleMenu() {}

    // Called when visible date range changes
    onVisibleDateRangeChange() {}

    // Called when visible resource range changes in vertical mode
    onVisibleResourceRangeChange() {}

    //endregion

    //region Scheduler specific date mapping functions

    async internalAddEvent(startDate, resourceRecord, row) {
        const
            me              = this,
            resourceRecords = [resourceRecord],
            eventRecord     = new me.eventStore.modelClass({
                startDate,
                endDate : DateHelper.add(startDate, 1, me.timeAxis.unit)
            });

        me.onEventCreated(eventRecord);

        if (me.eventEdit) {
            const
                eventData = me.currentOrientation.getTimeSpanRenderData(eventRecord, resourceRecord),
                proxyEl   = DomHelper.createElement({
                    parent    : me.foregroundCanvas,
                    className : 'b-sch-dragcreator-proxy',
                    style     : `width:${eventData.width}px;height:${eventData.height}px`
                });

            DomHelper.setTranslateXY(proxyEl, eventData.left, (row && row.top || 0) + eventData.top);

            me.editEvent(eventRecord, resourceRecord, proxyEl);
            return;
        }
        else if (me.taskEdit) {
            me.editEvent(eventRecord, resourceRecord);
            return;
        }

        /**
         * Fires before an event is added. Can be triggered by schedule double click, drag create action, or by the event editor.
         * @event beforeEventAdd
         * @param {Scheduler.view.Scheduler} source The Scheduler instance
         * @param {Scheduler.model.EventModel} eventRecord The record about to be added
         * @param {Scheduler.model.ResourceModel[]} resources **Deprecated 4.0** Use `resourceRecords` instead
         * @param {Scheduler.model.ResourceModel[]} resourceRecords Resources that the record is assigned to
         * @preventable
         */
        if (me.trigger('beforeEventAdd', { eventRecord, resourceRecords, resources : resourceRecords }) !== false) {
            me.eventStore.add(eventRecord);
            me.assignmentStore.assignEventToResource(eventRecord, resourceRecord);

            if (me.taskEdit) {
                await me.project.commitAsync();
                me.editEvent(eventRecord, resourceRecord);
            }
        }
    }

    /**
     * Checks if a date range is allocated or not for a given resource.
     * @param {Date} start The start date
     * @param {Date} end The end date
     * @param {Scheduler.model.EventModel|null} excludeEvent An event to exclude from the check (or null)
     * @param {Scheduler.model.ResourceModel} resource The resource
     * @return {Boolean} True if the timespan is available for the resource
     * @category Dates
     */
    isDateRangeAvailable(start, end, excludeEvent, resource) {
        return this.eventStore.isDateRangeAvailable(start, end, excludeEvent, resource);
    }

    //endregion

    /**
     * Suspends UI refresh on store operations.
     *
     * Multiple calls to `suspendRefresh` stack up, and will require an equal number of `resumeRefresh` calls to
     * actually resume UI refresh.
     *
     * @function suspendRefresh
     */

    /**
     * Resumes UI refresh on store operations.
     *
     * Multiple calls to `suspendRefresh` stack up, and will require an equal number of `resumeRefresh` calls to
     * actually resume UI refresh.
     *
     * Specify `true` as the first param to trigger a refresh if this call unblocked the refresh suspension.
     * If the underlying project is calculating changes, the refresh will be postponed until it is done.
     *
     * @param {Boolean} trigger `true` to trigger a refresh, if this resume unblocks the suspend
     * @returns {Promise}
     */
    async resumeRefresh(trigger) {
        super.resumeRefresh(false);

        if (!this.refreshSuspended && trigger) {
            // Do not refresh until project is in a valid state
            if (!this.isEngineReady) {
                // Refresh will happen because of the commit, bail out of this one after forcing rendering to consider
                // next one a full refresh
                this.currentOrientation.refreshAllWhenReady = true;
                return this.project.commitAsync();
            }

            // View could've been destroyed while we waited for engine
            if (!this.isDestroyed) {
                // If it already is, refresh now
                this.refreshWithTransition();
            }
        }
    }

    //region Appearance

    // Overrides grid to take crudManager loading into account
    toggleEmptyText() {
        const
            me = this;
        if (me.bodyContainer) {
            DomHelper.toggleClasses(me.bodyContainer, 'b-grid-empty', !(me.rowManager.rowCount || me.crudManager?.isLoading));
        }
    }

    // Overrides Grids base implementation to return a correctly calculated height for the row. Also stores it in
    // RowManagers height map, which is used to calculate total height etc.
    getRowHeight(resourceRecord) {
        if (this.currentOrientation.calculateRowHeight) {
            const height = this.currentOrientation.calculateRowHeight(resourceRecord);
            this.rowManager.storeKnownHeight(resourceRecord.id, height);
            return height;
        }
    }

    // Calculates the height for specified rows. Call when changes potentially makes its height invalid
    calculateRowHeights(resourceRecords, silent = false) {
        // Array allowed to have nulls in it for easier code when calling this fn
        resourceRecords.forEach(resourceRecord => resourceRecord && this.getRowHeight(resourceRecord));

        if (!silent) {
            this.rowManager.estimateTotalHeight(true);
        }
    }

    // Calculate heights for all rows (up to the preCalculateHeightLimit)
    calculateAllRowHeights(silent = false) {
        const
            { store, rowManager } = this,
            count                 = Math.min(store.count, this.preCalculateHeightLimit);

        // Allow opt out by specifying falsy value.
        if (count) {
            rowManager.clearKnownHeights();

            for (let i = 0; i < count; i++) {
                // This will both calculate and store the height
                this.getRowHeight(store.getAt(i));
            }

            // Make sure height is reflected on scroller etc.
            if (!silent) {
                rowManager.estimateTotalHeight(true);
            }
        }
    }

    //endregion

    //region Calendar Mode Interface

    // These are all internal and match up w/CalendarMixin

    get description() {
        return this.callback(this.descriptionRenderer, this, [this]);
    }

    get stepUnit() {
        return 'week';
    }

    getEventRecord(target) {
        target = DomHelper.getEventElement(target);

        return this.resolveEventRecord(target);
    }

    getEventElement(eventRecord) {
        return this.getElementFromEventRecord(eventRecord);
    }

    updateDate(newDate) {
        const start = DateHelper.startOf(newDate, this.stepUnit);

        this.setTimeSpan(start, DateHelper.add(start, 1, this.stepUnit));
    }

    previous() {
        this.date = DateHelper.add(this.startDate, -1, this.stepUnit);
    }

    next() {
        this.date = this.endDate;
    }

    //endregion

}

// Register this widget type with its Factory
SchedulerBase.initClass();

// Scheduler version is specified in TimelineBase because Gantt extends it
