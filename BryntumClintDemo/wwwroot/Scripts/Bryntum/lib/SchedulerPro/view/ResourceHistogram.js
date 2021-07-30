import SchedulerProBase from './SchedulerProBase.js';
import '../column/ScaleColumn.js';
import '../../Scheduler/feature/NonWorkingTime.js';

import '../localization/En.js';
import '../../Scheduler/column/TimeAxisColumn.js';

// Always required features
import '../../Grid/feature/Tree.js';
import '../../Grid/feature/RegionResize.js';
import Histogram from '../../Core/widget/graph/Histogram.js';
import { ResourceAllocationInfo } from '../../Engine/quark/model/scheduler_pro/SchedulerProResourceMixin.js';
import { TimeUnit } from '../../Engine/scheduling/Types.js';
import { CalculatedValueGen } from '../../ChronoGraph/chrono/Identifier.js';
import DateHelper from '../../Core/helper/DateHelper.js';
import { BaseCalendarMixin } from '../../Engine/quark/model/scheduler_basic/BaseCalendarMixin.js';

/**
 * @module SchedulerPro/view/ResourceHistogram
 */

/**
 * This widget displays a read-only timeline report of the workload for the resources in a {@link SchedulerPro.model.ProjectModel project}. The resource
 * allocation is visualized as bars along the time axis with an optional line indicating the maximum available time for each resource.
 *
 * To create a standalone histogram, simply configure it with a Project instance:
 * ```
 * const project = new ProjectModel({
 *    autoLoad : true,
 *    transport : {
 *        load : {
 *            url : 'examples/schedulerpro/view/data.json'
 *        }
 *    }
 * });
 *
 * const histogram = new ResourceHistogram({
 *    project,
 *    appendTo    : 'targetDiv',
 *    rowHeight   : 60,
 *    minHeight   : '20em',
 *    flex        : '1 1 50%',
 *    showBarTip  : true,
 *    columns     : [
 *        {
 *            width  : 200,
 *            field : 'name',
 *            text  : 'Resource'
 *        }
 *    ]
 * });
 * ```
 *
 * You can also pair the histogram with other timeline views such as the Gantt or Scheduler, using the {@link Scheduler/view/TimelineBase#config-partner} config.
 *
 * {@inlineexample schedulerpro/view/ResourceHistogram.js}
 * @extends Scheduler/view/SchedulerBase
 * @classtype resourcehistogram
 */
export default class ResourceHistogram extends SchedulerProBase {

    //region Config

    static get $name() {
        return 'ResourceHistogram';
    }

    static get type() {
        return 'resourcehistogram';
    }

    static get defaultConfig() {
        return {
            rowHeight : 50,

            /**
             * Default time unit to display resources effort values.
             * The value is used as default when displaying effort in tooltips and bars text.
             * Yet the effective time unit used might change dynamically when zooming in the histogram
             * so its ticks unit gets smaller than the default unit.
             * Please use {@link #config-barTipEffortUnit} to customize default units for tooltips only
             * and {@link #config-barTextEffortUnit} to customize default units in bar texts.
             * @config {String}
             * @default hour
             */
            effortUnit : TimeUnit.Hour,

            /**
             * Default time unit used for displaying resources effort in bars.
             * Yet the effective time unit used might change dynamically when zooming in the histogram
             * so its ticks unit gets smaller than the default unit.
             * Please use {@link #config-barTipEffortUnit} to customize default units for tooltips
             * (or {@link #config-effortUnit} to customize both texts and tooltips default units).
             * @config {String}
             * @default hour
             */
            barTextEffortUnit : null,

            /**
             * Default time unit used when displaying resources effort in tooltips.
             * Yet the effective time unit used might change dynamically when zooming in the histogram
             * so its ticks unit gets smaller than the default unit.
             * Please use {@link #config-barTextEffortUnit} to customize default units for bar texts
             * (or {@link #config-effortUnit} to customize both texts and tooltips default units).
             * @config {String}
             * @default hour
             */
            barTipEffortUnit : null,

            /**
             * Set to true if you want to display the maximum resource allocation line.
             * @config {Boolean}
             * @default
             */
            showMaxEffort : true,

            /**
             * Set to true if you want to display resources effort values in bars
             * (for example: `24h`, `7d`, `60min` etc.).
             * The text contents can be changed by providing {@link #config-getBarText} function.
             * @config {Boolean}
             * @default
             */
            showBarText : false,

            /**
             * Set to true if you want to display a tooltip when hovering an allocation bar.
             * Please use {@link #config-getBarTip} function to customize the tooltip contents.
             * @config {Boolean}
             * @default
             */
            showBarTip : false,

            series : {
                maxEffort : {
                    type  : 'outline',
                    field : 'maxEffort'
                },
                effort : {
                    type  : 'bar',
                    field : 'effort'
                }
            },

            /**
             * A Function which returns a CSS class name to add to a rectangle element.
             * The following parameters are passed:
             * @param {Object} series - The series being rendered
             * @param {Object} rectConfig - The rectangle configuration object
             * @param {Object} datum - The datum being rendered
             * @param {Number} index - The index of the datum being rendered
             * @config {Function}
             */
            getRectClass : null,

            /**
             * A Function which returns the tooltip text to display when hovering a bar.
             * The following parameters are passed:
             * @param {Object} series - The series being rendered
             * @param {Object} rectConfig - The rectangle configuration object
             * @param {Object} datum - The datum being rendered
             * @param {Number} index - The index of the datum being rendered
             * @config {Function}
             */
            getBarTip : null,

            /**
             * A Function which returns the text to render inside a bar.
             * The following parameters are passed:
             * @param {Object} datum - The datum being rendered
             * @param {Number} index - The index of the datum being rendered
             * @config {Function}
             */
            getBarText : null,

            fixedRowHeight : true
        };
    }

    //endregion

    //region Constructor/Destructor

    construct(config) {
        const me = this;

        me.allocationReportByResource = new Map();

        super.construct(config);

        // debounce refreshRows calls
        me.scheduleRefreshRows = me.createOnFrame(me.refreshRows, [], me, true);

        // TODO: hack to get rid of "Horizontal" store tracking approach.
        // It seems there is no need to use 99% of the "Horizontal" mode for the histogram
        // so ideally we need to make a special class for it.
        me.horizontal.refreshResourcesWhenReady = me.horizontal.onAssignmentStoreChange = me.horizontal.renderer = function() {};

        me.rowManager.on({
            beforeRowHeight : 'onBeforeRowHeight',
            thisObj         : me
        });

        me.timeAxis.on({
            endReconfigure : 'onTimeAxisEndReconfigure',
            thisObj        : this
        });
    }

    onDestroy() {
        this.histogramWidget.destroy();
    }

    //endregion

    //region Project

    updateProject(project) {
        const me = this;

        me.detachListeners('resourceHistogramProject');

        // No partial rendering until project is ready (which it is when onProjectRefresh is called)
        // me.suspendRendering = true;

        me._project = project;

        project.on({
            name               : 'resourceHistogramProject',
            startApplyResponse : 'onProjectStartApplyResponse',
            refresh            : 'internalOnProjectRefresh',

            thisObj : me
        });

        this.store = project.resourceStore;
    }

    //endregion

    //region Internal

    scheduleRefreshRows() {}

    // TODO: hack to get rid of "HorizontalRendering" events rendering logic
    getEventsToRender() {
    }

    getRowHeight() {
        return this.rowHeight;
    }

    get scaleColumn() {
        return this.columns.query(column => column.isScaleColumn)[0];
    }

    get scalePoints() {
        return this._scalePoints;
    }

    set scalePoints(scalePoints) {
        const
            { project, histogramWidget, scaleColumn } = this,
            lastPoint = scalePoints[scalePoints.length - 1],
            { value : scaleMax, unit : scaleUnit } = lastPoint;

        this.scaleUnit    = scaleUnit;
        this._scalePoints = scalePoints;

        let maxInScaleUnits = scaleMax;

        if (scaleColumn) {
            const { scaleWidget } = scaleColumn;

            maxInScaleUnits += scaleWidget.scaleMaxPadding * scaleMax;
        }

        // Applying new maximum value to the histogram.
        // We have to convert scale units to milliseconds since allocation report provides values in milliseconds.
        histogramWidget.topValue = project.convertDuration(maxInScaleUnits, scaleUnit, TimeUnit.Millisecond);

        // Applying new points to the scale column
        if (scaleColumn) {
            scaleColumn.scalePoints = scalePoints;
        }
    }

    buildScalePointText(scalePoint) {
        return `${scalePoint.value}${DateHelper.getShortNameOfUnit(scalePoint.unit)}`;
    }

    generateScalePoints() {
        const
            { project, timeAxis } = this,
            scalePoints = [];

        let
            { unit, increment : scaleMax } = timeAxis,
            scaleStep;

        // If the ticks are defined as 1 unit let's break it down to smaller units
        if (scaleMax === 1) {
            // getting timeaxis tick sub-unit and number of them in a tick
            unit     = DateHelper.getSmallerUnit(unit);
            scaleMax = Math.round(project.convertDuration(scaleMax, timeAxis.unit, unit));
        }

        // Let's try to guess how many points in the scale will work nicely
        for (const factor of [7, 5, 4, 3, 2]) {
            // unitsNumber is multiple of "factor" -> we generate "factor"-number of points
            if (!(scaleMax % factor)) {
                scaleStep = scaleMax / factor;
                break;
            }
        }

        // fallback to a single point equal to maximum value
        if (!scaleStep) {
            scaleStep = scaleMax;
        }

        for (let value = scaleStep; value <= scaleMax; value += scaleStep) {
            scalePoints.push({
                value
            });
        }

        const lastPoint = scalePoints[scalePoints.length - 1];
        // put unit and label to the last point
        lastPoint.unit = unit;
        lastPoint.text = this.buildScalePointText(lastPoint);

        return scalePoints;
    }

    updateViewPreset(viewPreset) {
        const me = this;

        // Set a flag indicating that we're inside of `updateViewPreset` so our `onTimeAxisEndReconfigure` will skip its call.
        // We call it here later.
        me._updatingViewPreset = true;
        super.updateViewPreset(...arguments);
        me._updatingViewPreset = false;

        // In `super,updateViewPreset` function `this.render` is called which checks if the engine is not dirty
        // ..and we modify `ticksIdentifier` atom in `onTimeAxisEndReconfigure`
        // so the engine state gets dirty and rendering gets delayed which ends up an exception.
        // So we call `onTimeAxisEndReconfigure` after super `updateViewPreset` code
        // to keep the engine non-dirty while zooming/setting a preset.
        // This scenario is covered w/ SchedulerPro/tests/pro/view/ResourceHistogramZoom.t.js
        if (me.project.isInitialCommitPerformed && me.isPainted) {
            me.onTimeAxisEndReconfigure();
        }
    }

    buildTicksIdentifier() {
        const
            me = this,
            graph = me.project.getGraph();

        if (!me.ticksIdentifier) {
            me.ticksIdentifier = graph.addIdentifier(CalculatedValueGen.new());
        }

        me.ticksIdentifier.writeToGraph(graph, new BaseCalendarMixin({
            unspecifiedTimeIsWorking : false,
            intervals                : me.timeAxis.ticks.map(tick => {
                return {
                    startDate : tick.startDate,
                    endDate   : tick.endDate,
                    isWorking : true
                };
            })
        }));

        // process ticks to detect if their widths are monotonous
        // or some tick has a different width value
        me.collectTicksWidth();

        return me.ticksIdentifier;
    }

    collectTicksWidth() {
        const
            { ticks }     = this.timeAxis,
            prevDuration  = ticks[0].endDate - ticks[0].startDate,
            tickDurations = { 0 : prevDuration };

        let
            totalDuration = prevDuration,
            isMonotonous  = true;

        for (let i = 1, { length } = ticks; i < length; i++) {
            const
                tick   = ticks[i],
                duration = tick.endDate - tick.startDate;

            // the ticks width is different -> reset isMonotonous flag
            if (prevDuration !== duration) {
                isMonotonous = false;
            }

            totalDuration    += duration;
            tickDurations[i] = duration;
        }

        // if the ticks widths are not monotonous we need to calculate
        // each bar width to provide it to the histogram widget later
        if (!isMonotonous) {
            const ticksWidth = {};
            for (let i = 0, { length } = ticks; i < length; i++) {
                ticksWidth[i] = tickDurations[i] / totalDuration;
            }
            this.ticksWidth = ticksWidth;
        }
        else {
            this.ticksWidth = null;
        }
    }

    resumeRefresh(trigger) {

        super.resumeRefresh(false);

        if (!this.refreshSuspended && trigger) {
            if (!this.rowManager.topRow) {
                // TODO: investigate why we need this
                this.rowManager.reinitialize();
            }
            else {
                this.refreshWithTransition();
            }
        }
    }

    internalOnProjectRefresh() {
        const me = this;

        if (!me.ticksIdentifier) {
            me.onTimeAxisEndReconfigure();
        }

        me.resumeRefresh(!me.rowManager.topRow);
    }

    get columns() {
        return super.columns;
    }

    set columns(columns) {
        const me = this;

        super.columns = columns;

        if (!me.isDestroying) {
            me.timeAxisColumn.renderer = me.renderResourceHistogram;
            me.timeAxisColumn.cellCls = 'b-resourcehistogram-cell';

            // Insert the scale column in the correct place
            me.columns.rootNode.insertChild({
                type : 'scale'
            }, me.timeAxisColumn);
        }
    }

    onProjectStartApplyResponse() {
        this.suspendRefresh();
    }

    get histogramWidget() {
        const me = this;

        if (!me._histogramWidget) {

            const series = me.series;

            if (!me.showMaxEffort && series.maxEffort) {
                series.maxEffort = false;
            }

            me._histogramWidget = new Histogram({
                owner              : me,
                appendTo           : me.element,
                cls                : 'b-hide-offscreen b-resourcehistogram-histogram',
                height             : me.rowHeight,
                width              : me.timeAxisColumn ? me.timeAxisColumn.width : 0,
                omitZeroHeightBars : true,
                data               : [],
                getRectClass       : me.getRectClass,
                getBarText         : me.getBarText,
                getBarTip          : me.getBarTip,
                series
            });
        }

        return me._histogramWidget;
    }

    // Injectable method.
    getRectClass(series, rectConfig, datum, index) {
        if (series.id === 'effort') {
            switch (true) {
                case datum.isOverallocated : return 'b-overallocated';

                case datum.isUnderallocated : return 'b-underallocated';
            }
        }

        return '';
    }

    getEffortText(effort, unit) {
        const
            { scaleUnit, project } = this;

        unit = unit || scaleUnit;

        const
            localizedUnit = DateHelper.getShortNameOfUnit(unit),
            effortInUnits = project.convertDuration(effort, TimeUnit.Millisecond, unit);

        return `${parseFloat(effortInUnits.toFixed(1))}${localizedUnit}`;
    }

    getBarTipEffortUnit(series, rectConfig, datum, index) {
        const
            { effortUnit, barTipEffortUnit, timeAxis } = this,
            defaultUnit = barTipEffortUnit || effortUnit;

        return DateHelper.compareUnits(timeAxis.unit, defaultUnit) < 0 ? timeAxis.unit : defaultUnit;
    }

    // Injectable method.
    getBarTip(series, rectConfig, datum, index) {
        const
            resourceHistogram = this.owner,
            { showBarTip, timeAxis } = resourceHistogram;

        let result = '';

        if (showBarTip && datum.effort) {

            const
                unit       = resourceHistogram.getBarTipEffortUnit(...arguments),
                allocated  = resourceHistogram.getEffortText(datum.effort, unit),
                available  = resourceHistogram.getEffortText(datum.maxEffort, unit);

            let
                dateFormat   = 'L',
                resultFormat = resourceHistogram.L('L{barTipInRange}');

            if (DateHelper.compareUnits(timeAxis.unit, TimeUnit.Day) == 0) {
                resultFormat = resourceHistogram.L('L{barTipOnDate}');
            }
            else if (DateHelper.compareUnits(timeAxis.unit, TimeUnit.Second) <= 0) {
                dateFormat = 'HH:mm:ss A';
            }
            else if (DateHelper.compareUnits(timeAxis.unit, TimeUnit.Hour) <= 0) {
                dateFormat = 'LT';
            }

            // TODO: we need smth like sprintf("has {0} of {1} items", cnt, total)
            // to be able to test localizable strings
            result = resultFormat
                .replace('{resource}', datum.resource.name)
                .replace('{startDate}', DateHelper.format(datum.tick.startDate, dateFormat))
                .replace('{endDate}', DateHelper.format(datum.tick.endDate, dateFormat))
                .replace('{allocated}', allocated)
                .replace('{available}', available);
        }

        return result;
    }

    getBarTextEffortUnit(series, rectConfig, datum, index) {
        const
            { effortUnit, barTextEffortUnit, timeAxis } = this,
            defaultUnit = barTextEffortUnit || effortUnit;

        return DateHelper.compareUnits(timeAxis.unit, defaultUnit) < 0 ? timeAxis.unit : defaultUnit;
    }

    // Injectable method.
    getBarText(datum, index) {
        const
            { showBarText } = this.owner;

        let result = '';

        if (showBarText && datum.effort) {
            const unit = this.owner.getBarTextEffortUnit(...arguments);
            result = this.owner.getEffortText(datum.effort, unit);
        }

        return result;
    }

    get showBarText() {
        return this._showBarText;
    }

    set showBarText(value) {
        this._showBarText = value;
        this.scheduleRefreshRows();
        // this.refreshRows();
    }

    get showBarTip() {
        return this._showBarTip;
    }

    set showBarTip(value) {
        this._showBarTip = value;
        this.scheduleRefreshRows();
        // this.refreshRows();
    }

    get showMaxEffort() {
        return this._showMaxEffort;
    }

    set showMaxEffort(value) {
        const
            me = this;

        me._showMaxEffort = value;

        if (me._histogramWidget) {
            const
                { series } = me._histogramWidget;

            if (!value) {
                if (series.maxEffort) {
                    me._seriesMaxEffort = series.maxEffort;
                    delete series.maxEffort;
                }
            }
            else {
                if (typeof value === 'object') {
                    series.maxEffort = value;
                }
                else if (typeof me._seriesMaxEffort === 'object') {
                    series.maxEffort = me._seriesMaxEffort;
                }
                else {
                    series.maxEffort = {
                        type  : 'outline',
                        field : 'maxEffort'
                    };
                    series.maxEffort.id = 'maxEffort';
                }
            }

            me.scheduleRefreshRows();
            // me.refreshRows();
        }
    }

    //endregion

    //region Events

    onTimeAxisEndReconfigure() {
        // Skip call triggered by viewPreset setting we have `updateViewPreset` method overridden where we call `onTimeAxisEndReconfigure` later
        if (!this._updatingViewPreset) {
            const { unit, increment } = this.timeAxis;

            // re-generate scale point on zooming in/out
            if (unit !== this._lastTimeAxisUnit || increment !== this._lastTimeAxisIncrement) {
                // remember last used unit & increment to distinguish zooming from timespan changes
                this._lastTimeAxisUnit = unit;
                this._lastTimeAxisIncrement = increment;

                this._generatedScalePoints = this.scalePoints = this.generateScalePoints();
            }

            this.buildTicksIdentifier();
        }
    }

    onBeforeRowHeight({ height }) {
        // TODO: histogramWidget getter requests timeAxisColumn column too early which causes an infinite cycle
        if (this._timeAxisColumn) {
            const { histogramWidget } = this;

            histogramWidget.height = height;
            histogramWidget.onElementResize(histogramWidget.element);
        }
    }

    onTimeAxisViewModelUpdate() {
        const { histogramWidget } = this;

        histogramWidget.width = this.timeAxisViewModel.totalSize;
        histogramWidget.onElementResize(histogramWidget.element);
    }

    //endregion

    //region Render

    renderResourceAllocationInfo(allocation, cellElement) {
        // if ticks widths are not monotonous
        // we provide width for each bar since in that case the histogram widget won't be able to calculate widths properly
        if (this.ticksWidth) {
            for (let i = 0, { length } = allocation; i < length; i++) {
                allocation[i].width = this.ticksWidth[i];
            }
        }

        const
            { histogramWidget } = this;

        histogramWidget.data = allocation;
        histogramWidget.refresh();

        const histogramCloneElement = histogramWidget.element.cloneNode(true);
        histogramCloneElement.removeAttribute('id');
        histogramCloneElement.classList.remove('b-hide-offscreen');

        cellElement.innerHTML = '';
        cellElement.appendChild(histogramCloneElement);
    }

    renderRows() {
        if (!this.ticksIdentifier && this.project.isInitialCommitPerformed) {
            // If we render rows but have no ticksIdentifier means data loading and 1st commit
            // happened before the histogram was created.
            // Handle timeaxis settings to build ticksIdentifier and scale column points.
            this.onTimeAxisEndReconfigure();

            // If timeView range is not defined then the timeaxis header looks empty so fill it in here (it triggers the column refresh)
            if (!this.timeView.startDate || !this.timeView.endDate) {
                this.timeView.range = {
                    startDate : this.startDate,
                    endDate   : this.endDate
                };
            }
        }

        return super.renderRows(...arguments);
    }

    buildResourceAllocationReport(resource) {
        return ResourceAllocationInfo.new({ resource, ticks : this.ticksIdentifier });
    }

    renderResourceHistogram({ grid : timeline, cellElement, record : resource }) {
        // No drawing before engine's initial commit
        // Skip special rows, e.g. group records
        if (timeline.project.isInitialCommitPerformed && !resource.isSpecialRow) {
            const
                { allocationReportByResource } = timeline,
                allocationReport               = allocationReportByResource.get(resource);

            // If we have no allocation report built for the resource yet
            // let's initialize it here
            if (!allocationReport) {
                const
                    graph                   = timeline.project.getGraph(),
                    allocationReport        = timeline.buildResourceAllocationReport(resource),
                    { observers, entities } = resource;

                // store resource allocation report reference
                allocationReportByResource.set(resource, allocationReport);

                graph.addEntity(allocationReport);

                entities.add(allocationReport);

                // trigger rendering on allocation report changes
                observers.add(graph.observe(function * () {
                    return yield allocationReport.$.allocation;
                }, allocation => {
                    if (!timeline.isDestroying) {
                        const cell = timeline.getCell({ id : resource.id, columnId : timeline.timeAxisColumn.id });
                        timeline.renderResourceAllocationInfo(allocation, cell);
                    }
                }));
            }
            // rendering was triggered by not allocation report change so we render based on existing "resource.allocation"
            else if (allocationReport.allocation) {
                if (allocationReport.graph) {
                    timeline.renderResourceAllocationInfo(allocationReport.allocation, cellElement);
                }
                // allocation data had left the graph probably after the resource was removed
                else {
                    allocationReportByResource.delete(resource);
                }
            }
        }
    }

    //endregion

    //region Localization

    updateLocalization() {
        // Translate scale points if we have them (update localization on construction step is called too early)
        // and the scale points is generated by the histogram which means their labels use localized unit abbreviations
        if (this._generatedScalePoints === this.scalePoints && this.scalePoints) {
            this.scalePoints.forEach(scalePoint => {
                // if the point is labeled let's rebuild its text using new locale
                if (scalePoint.text && scalePoint.unit) {
                    scalePoint.text = this.buildScalePointText(scalePoint);
                }
            });
        }

        super.updateLocalization(...arguments);
    }

    //endregion

}

ResourceHistogram.initClass();
