import SchedulerBase from '../../Scheduler/view/SchedulerBase.js';
import '../../Scheduler/feature/TimeRanges.js';
import Store from '../../Core/data/Store.js';
import { SchedulerProProjectMixin } from '../../../lib/Engine/quark/model/scheduler_pro/SchedulerProProjectMixin.js';

/**
 * @module SchedulerPro/widget/Timeline
 */

/**
 * A visual component showing an overview timeline of events having the {@link SchedulerPro.model.EventModel#field-showInTimeline showInTimeline}
 * field set to true. The timeline component subclasses the {@link Scheduler.view.Scheduler Scheduler} and to use it,
 * simply provide it with a {@link SchedulerPro.model.ProjectModel}:
 *
 * ```javascript
 * const timeline = new Timeline({
 *     appendTo  : 'container',
 *     project   : project
 * });
 * ```
 *
 *
 * {@inlineexample schedulerpro/widget/Timeline.js}
 *
 * @extends Scheduler/view/Scheduler
 * @classType timeline
 */
export default class Timeline extends SchedulerBase {

    static get $name() {
        return 'Timeline';
    }

    // Factoryable type name
    static get type() {
        return 'timeline';
    }

    static get defaultConfig() {
        return {
            /**
             * Project config object or a Project instance
             *
             * @config {SchedulerPro.model.ProjectModel|Object} project
             */

            height      : '13em',
            eventLayout : 'pack',
            barMargin   : 1,

            // We need timeline width to be exact, because with `overflow: visible` content will look awful.
            // Flow is like this:
            // 1. zoomToFit is trying to set timespan to eventStore total time span. Assume start in on tuesday and end is on friday
            // 2. zooming mixin is calculating tick width, which is e.g. 37px to fit all the ticks to the available space
            // 3. timeAxis is configured with this new time span. By default it adjusts start and end to monday.
            // 4. since timespan was increased, it now overflows with original tick size of 37. It requires smth smaller, like 34.
            // 5. timeAxisViewModel is calculating fitting size. Which is correct value of 34, but value is ignored unless `forceFit` is true
            // But apparently forceFit + zoomToSpan IS NOT SUPPORTED. So alternative approach is to disable autoAdjust
            // on time axis to prevent increased size in #3. But then time axis start/end won't be even date, it could be
            // smth random like `Thu Feb 07 2019 22:13:20`.
            //
            // On the other hand, without force-fit content might overflow and timeline is styled to show overflowing content.
            // And that would require more additional configs
            forceFit : true,
            timeAxis : { autoAdjust : false },

            readOnly                  : true,
            zoomOnMouseWheel          : false,
            zoomOnTimeAxisDoubleClick : false,
            eventColor                : null,
            eventStyle                : null,
            rowHeight                 : 48,
            displayDateFormat         : 'L',

            // Despite the fact Timeline extends SchedulerBase, we still need to disable all those features.
            // Because in case timeline gets into the same scope as scheduler or gantt, some features might be enabled
            // by default. SchedulerBase jut means that we don't import anything extra. But other components might.
            features : {
                cellEdit            : false,
                cellMenu            : false,
                columnAutoWidth     : false,
                columnLines         : false,
                columnPicker        : false,
                columnReorder       : false,
                columnResize        : false,
                contextMenu         : false,
                eventContextMenu    : false,
                eventDrag           : false,
                eventDragCreate     : false,
                eventEdit           : false,
                eventFilter         : false,
                eventMenu           : false,
                eventResize         : false,
                eventTooltip        : false,
                group               : false,
                headerMenu          : false,
                regionResize        : false,
                scheduleContextMenu : false,
                scheduleMenu        : false,
                scheduleTooltip     : false,
                sort                : false,
                timeAxisHeaderMenu  : false,
                timeRanges          : {
                    showCurrentTimeLine : true
                }
            },

            // A fake resource
            resources : [
                {
                    id : 1
                }
            ],

            columns : []
        };
    }

    static get delayable() {
        return {
            fillFromTaskStore : 100
        };
    }

    construct(config) {
        const me = this;

        me.startDateLabel = document.createElement('label');
        me.startDateLabel.className = 'b-timeline-startdate';
        me.endDateLabel = document.createElement('label');
        me.endDateLabel.className = 'b-timeline-enddate';

        if ('project' in config) {
            if (!config.project) {
                throw new Error('You need to configure the Timeline with a Project');
            }
            // In case instance of project is provided, just take store right away and delete config, falling back to
            // default
            else if (config.project instanceof SchedulerProProjectMixin) {
                me.taskStore = config.project.eventStore;

                if (!config.project.isInitialCommitPerformed) {
                    // For schedulerpro it is important to listen to first project commit
                    config.project.on({
                        refresh({ isInitialCommit }) {
                            if (isInitialCommit) {
                                this.fillFromTaskStore();
                            }
                        },
                        once    : true,
                        thisObj : this
                    });
                }

                delete config.project;
            }
        }

        super.construct(config);

        if (me.features.timeRanges) {
            // We don't want to show timeRanges relating to Project
            me.features.timeRanges.store = new Store();
        }

        me.fillFromTaskStore.now();

        me.taskStore.on({
            refreshPreCommit : me.fillFromTaskStore,
            changePreCommit  : me.onTaskStoreChange,
            thisObj          : me
        });

        me.on({
            resize  : me.onSizeChanged,
            thisObj : me
        });

        me.bodyContainer.appendChild(me.startDateLabel);
        me.bodyContainer.appendChild(me.endDateLabel);
    }

    onSizeChanged({ width, oldWidth }) {

        this.suspendRefresh();

        this.updateRowHeight();
        this.resumeRefresh();

        if (width !== oldWidth) {
            this.fitTimeline();
        }
    }

    updateRowHeight() {
        this.rowHeight = this.bodyContainer.offsetHeight;
    }

    fitTimeline() {
        if (this.eventStore.count > 0) {
            this.zoomToFit(
                {
                    leftMargin  : 50,
                    rightMargin : 50
                }
            );
        }

        this.updateStartEndLabels();
    }

    updateStartEndLabels() {
        const me = this;
        me.startDateLabel.innerHTML = me.getFormattedDate(me.startDate);
        me.endDateLabel.innerHTML = me.getFormattedDate(me.endDate);
    }

    async onTaskStoreChange({ action, record, records, changes, isCollapse }) {
        const
            me = this,
            eventStore = me.eventStore;

        let needsFit;

        switch (action) {
            case 'add':
                records.forEach(task => {
                    if (task.showInTimeline) {
                        eventStore.add(me.cloneTask(task));
                        needsFit = true;
                    }
                });
                break;
            case 'remove':
                if (!isCollapse) {
                    records.forEach(task => {
                        if (task.showInTimeline) {
                            eventStore.remove(task.id);
                            needsFit = true;
                        }
                    });
                }
                break;
            case 'removeall':
                me.fillFromTaskStore();
                break;

            case 'update':
            {
                const task = record;

                if (changes.showInTimeline) {
                    // Add or remove from our eventStore
                    if (task.showInTimeline) {
                        eventStore.add(me.cloneTask(task));
                    }
                    else {
                        eventStore.remove(eventStore.getById(task.id));
                    }
                    needsFit = true;
                }
                else if (task.showInTimeline) {
                    // Just sync with existing clone
                    const clone = eventStore.getById(task.id);

                    if (clone) {
                        const filteredData = Object.assign({}, task.data);

                        // Not allowed to set 'expanded' flat
                        delete filteredData.expanded;

                        // When duration is provided project will try to calculate end date from it. We don't need that
                        // because timeline project doesn't have any calendars. We just trust start/end from task.
                        delete filteredData.duration;
                        delete filteredData.durationUnit;

                        // delete calendar instance
                        delete filteredData.calendar;

                        clone.set(filteredData);
                        needsFit = true;
                    }
                }
                break;
            }
        }

        if (needsFit) {
            me.fitTimeline();
        }
    }

    cloneTask(task) {
        return {
            id         : task.id,
            resourceId : 1,
            startDate  : task.startDate,
            endDate    : task.endDate,
            name       : task.name
        };
    }

    render() {
        super.render();

        this.updateRowHeight();
    }

    async fillFromTaskStore() {
        const
            me = this,
            timelineTasks = [];

        me.taskStore.traverse(task => {
            if (task.showInTimeline && task.isScheduled) {
                timelineTasks.push(me.cloneTask(task));
            }
        });

        me.suspendRefresh();

        me.events = timelineTasks;
        await me.project.commitAsync();

        if (me.isDestroyed) return;

        me.resumeRefresh(true);

        me.fitTimeline();
    }

    onLocaleChange() {
        this.updateStartEndLabels();
        super.onLocaleChange();
    }
};

// Register this widget type with its Factory
Timeline.initClass();
