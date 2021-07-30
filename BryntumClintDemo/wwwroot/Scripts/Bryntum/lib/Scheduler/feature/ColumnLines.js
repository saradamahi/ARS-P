import DomHelper from '../../Core/helper/DomHelper.js';
import DomSync from '../../Core/helper/DomSync.js';
import InstancePlugin from '../../Core/mixin/InstancePlugin.js';
import GridFeatureManager from '../../Grid/feature/GridFeatureManager.js';

/**
 * @module Scheduler/feature/ColumnLines
 */

/**
 * Displays column lines for ticks, with a different styling for major ticks (by default they are darker). If this
 * feature is disabled, no lines are shown. If it's enabled, line are shown for the tick level which is set in current
 * ViewPreset. Please see {@link Scheduler.preset.ViewPreset#field-columnLinesFor} config for details.
 *
 * The lines are drawn as divs, with only visible lines available in DOM. The color and style of the lines are
 * determined the css rules for `.b-column-line` and `.b-column-line-major`.
 *
 * For vertical mode, this features also draws vertical resource column lines if scheduler is configured with
 * `columnLines : true` (which is the default, see {@link Grid.view.GridBase#config-columnLines}).
 *
 * This feature is **enabled** by default
 *
 * @extends Core/mixin/InstancePlugin
 * @demo Scheduler/basic
 * @externalexample scheduler/ColumnLines.js
 * @classtype columnLines
 * @feature
 */
export default class ColumnLines extends InstancePlugin {
    //region Config

    static get $name() {
        return 'ColumnLines';
    }

    // Plugin configuration. This plugin chains some of the functions in Grid.
    static get pluginConfig() {
        return {
            after : ['render', 'updateCanvasSize', 'onVisibleDateRangeChange', 'onVisibleResourceRangeChange']
        };
    }

    //endregion

    //region Init & destroy

    construct(client, config) {
        client.useBackgroundCanvas = true;

        super.construct(client, config);
    }

    doDisable(disable) {
        super.doDisable(disable);

        if (!this.isConfiguring) {
            this.refresh();
        }
    }

    //endregion

    //region Draw

    /**
     * Draw lines when scheduler/gantt is rendered.
     * @private
     */
    render() {
        this.refresh();
    }

    /**
     * Draw column lines that are in view
     * @private
     */
    refresh() {
        const
            me                                            = this,
            { client }                                    = me,
            { timeAxis, timeAxisViewModel, isHorizontal } = client,
            axisStart                                     = timeAxis.startDate;

        // Early bailout for timeaxis without start date
        if (!axisStart || !me.startDate) {
            return;
        }

        const
            linesForLevel      = timeAxisViewModel.columnLinesFor,
            majorLinesForLevel = Math.max(linesForLevel - 1, 0),
            start              = me.startDate.getTime(),
            end                = me.endDate.getTime(),
            domConfigs         = [],
            dates              = new Set();

        if (!me.element) {
            me.element = DomHelper.createElement({
                parent    : client.backgroundCanvas,
                className : 'b-column-lines-canvas'
            });
        }

        if (!me.disabled) {
            const addLineConfig = (tick, isMajor) => {
                const tickEnd = tick.end.getTime();
                // Only end of tick matters, not a typo :)
                if (tickEnd > start && tickEnd < end && !dates.has(tickEnd)) {
                    dates.add(tickEnd);
                    domConfigs.push({
                        className : isMajor ? 'b-column-line-major' : 'b-column-line',
                        style     : {
                            //End date is exclusive, thus -1
                            [isHorizontal ? 'left' : 'top'] : tick.coord + tick.width - 1
                        },
                        dataset : {
                            line : isMajor ? `major-${tick.index}` : `line-${tick.index}`
                        }
                    });
                }
            };

            // Collect configs for major lines
            if (linesForLevel !== majorLinesForLevel) {
                timeAxisViewModel.columnConfig[majorLinesForLevel].forEach(tick => addLineConfig(tick, true));
            }

            // And normal lines, skipping dates already occupied by major lines
            timeAxisViewModel.columnConfig[linesForLevel].forEach(tick => addLineConfig(tick, false));

            // Add vertical resource column lines, if grid is configured to show column lines
            if (!isHorizontal && client.columnLines) {
                const { columnWidth, firstResource, lastResource } = client.resourceColumns;

                for (let i = firstResource; i < lastResource + 1; i++) {
                    domConfigs.push({
                        className : 'b-column-line b-resource-column-line',
                        style     : {
                            left : (i + 1) * columnWidth - 1
                        },
                        dataset : {
                            line : `resource-${i}`
                        }
                    });
                }
            }
        }

        DomSync.sync({
            targetElement : me.element,
            onlyChildren  : true,
            domConfig     : {
                children    : domConfigs,
                syncOptions : {
                    // When zooming in and out we risk getting a lot of released lines if we do not limit it
                    releaseThreshold : 4
                }
            },
            syncIdField : 'line'
        });
    }

    //endregion

    //region Events

    // Called when visible date range changes, for example from zooming, scrolling, resizing
    onVisibleDateRangeChange({ startDate, endDate }) {
        this.startDate = startDate;
        this.endDate = endDate;

        this.refresh();
    }

    // Called when visible resource range changes, for example on scroll and resize
    onVisibleResourceRangeChange({ firstResource, lastResource }) {
        this.refresh();
    }

    updateCanvasSize() {
        this.refresh();
    }

    //endregion
}

GridFeatureManager.registerFeature(ColumnLines, true, ['Scheduler', 'Gantt']);
