import InstancePlugin from '../../Core/mixin/InstancePlugin.js';
import GridFeatureManager from '../../Grid/feature/GridFeatureManager.js';
import DragHelper from '../../Core/helper/DragHelper.js';
import DomHelper from '../../Core/helper/DomHelper.js';
import DomSync from '../../Core/helper/DomSync.js';

/**
 * @module SchedulerPro/feature/PercentBar
 */

//region Static

function cls(classes) {
    return `b-task-percent-bar${classes[0] ? `-${classes[0]}` : ''}`;
}

//endregion

/**
 * This feature visualizes the {@link SchedulerPro.model.mixin.PercentDoneMixin#field-percentDone percentDone} field as a
 * progress bar on the event elements. Each progress bar also optionally has a drag handle which users can drag can
 * change the value.
 *
 * This feature is **enabled** by default in Gantt, but **off** by default in Scheduler Pro.
 *
 * @extends Core/mixin/InstancePlugin
 * @classtype percentBar
 * @feature
 */
export default class PercentBar extends InstancePlugin {

    //region Config

    static get $name() {
        return 'PercentBar';
    }

    static get configurable() {
        return {
            /**
             * `true` to allow drag drop resizing to set the % done
             * @config {Boolean}
             * @default
             */
            allowResize : true,

            /**
             * `true` to allow show a small % done label within the event while drag changing its value
             * @config {Boolean}
             * @default
             */
            showPercentage : true
        };
    }

    static get pluginConfig() {
        return {
            chain : ['onPaint', 'onTaskDataGenerated', 'onEventDataGenerated']
        };
    }

    //endregion

    //region Init

    /**
     * Called when scheduler is painted. Sets up drag and drop and hover tooltip.
     * @private
     */
    onPaint({ firstPaint }) {
        if (firstPaint) {
            const
                me         = this,
                { client } = me;

            me.drag = new DragHelper({
                name           : 'percentBarHandle',
                mode           : 'translateX',
                // Handle is not draggable for parents
                targetSelector : `${client.eventSelector}:not(.${client.eventCls}-parent) .b-task-percent-bar-handle`,
                dragThreshold  : 1,
                outerElement   : client.timeAxisSubGridElement,
                listeners      : {
                    beforeDragStart : 'onBeforeDragStart',
                    dragStart       : 'onDragStart',
                    drag            : 'onDrag',
                    drop            : 'onDrop',
                    abort           : 'onDragAbort',
                    thisObj         : me
                }
            });

            me.detachListeners('view');

            me.client.on({
                name                                       : 'view',
                [`${client.scheduledEventName}mouseenter`] : 'onTimeSpanMouseEnter',
                [`${client.scheduledEventName}mouseleave`] : 'onTimeSpanMouseLeave',
                thisObj                                    : me
            });
        }
    }

    updateAllowResize(value) {
        this.client.element.classList[value ? 'remove' : 'add'](cls`drag-disabled`);
    }

    updateShowPercentage(value) {
        this.client.element.classList[value ? 'add' : 'remove'](cls`show-percentage`);
    }

    doDestroy() {
        this.drag && this.drag.destroy();
        super.doDestroy();
    }

    doDisable(disable) {
        // Redraw to toggle percent bars
        if (this.client.isPainted) {
            this.client.refresh();
        }

        super.doDisable(disable);
    }

    //endregion

    //region Contents

    cleanup(context) {
        const
            me     = this,
            taskEl = context.element.closest(me.client.eventSelector);

        taskEl.classList.remove(cls`resizing`);

        me.client.element.classList.remove(cls`resizing-task`);

        // Remove handle if operation ended outside of the event
        if (!me.isMouseInsideEvent) {
            me.handle.remove();
            me.handle = null;
        }
    }

    appendDOMConfig(record, children) {
        if ((record.isEvent || record.isTask) && !record.isMilestone && !this.disabled) {
            children.unshift({
                className : cls`outer`,
                dataset   : {
                    taskBarFeature : 'percentBar'
                },
                children : [
                    {
                        className : cls``,
                        dataset   : {
                            percent : record.renderedPercentDone
                        },
                        style : {
                            width : record.percentDone + '%'
                        }
                    }
                ]
            });
        }
    }

    // For Scheduler Pro
    onEventDataGenerated(eventData) {
        this.appendDOMConfig(eventData.eventRecord, eventData.children);
    }

    // For Gantt
    onTaskDataGenerated(taskData) {
        this.appendDOMConfig(taskData.task, taskData.children);
    }

    //endregion

    //region Events

    // Inject handle on mouse over
    onTimeSpanMouseEnter(event) {
        const
            me     = this,
            record = event[`${me.client.scheduledEventName}Record`];

        // No ongoing drag
        if (!me.drag.context) {
            const
                element = event[`${me.client.scheduledEventName}Element`],
                parent  = DomSync.getChild(element, me.client.scheduledEventName);

            // Add handle if not already there
            if (!me.handle) {
                me.handle = DomHelper.createElement({
                    parent,
                    className : cls`handle`,
                    style     : {
                        left : record.percentDone + '%'
                    },
                    dataset : {
                        percent : record.percentDone
                    }
                });
            }

            // Mouse is inside event, used later to not remove handle
            me.isMouseInsideEvent = true;
        }
        // Ongoing drag, mouse coming back into active event
        else if (record === me.drag.context.taskRecord) {
            // Mouse is inside event, used later to not remove handle
            me.isMouseInsideEvent = true;
        }
    }

    // Remove handle on mouse leave, if not dragging
    onTimeSpanMouseLeave() {
        const me = this;

        if (!me.drag.context && me.handle) {
            me.handle.remove();
            me.handle = null;
        }

        me.isMouseInsideEvent = false;
    }

    onBeforeDragStart({ source, context }) {
        const
            percentBarOuter = DomSync.getChild(context.element.parentElement, 'percentBar'),
            percentBar      = percentBarOuter.firstElementChild,
            initialX        = percentBar.offsetWidth,
            outerWidth      = percentBarOuter.offsetWidth,
            taskRecord      = this.client.resolveEventRecord(context.element);

        source.minX = -initialX;
        source.maxX =  outerWidth - initialX;

        Object.assign(context, {
            percentBar,
            initialX,
            outerWidth,
            taskRecord
        });
    }

    onDragStart({ context }) {
        const
            { client } = this,
            taskEl     = context.element.closest(client.eventSelector);

        taskEl.classList.add(cls`resizing`);
        client.element.classList.add(cls`resizing-task`);

        context.element.retainElement = true;
    }

    onDrag({ context }) {
        const percent = Math.round(((context.initialX + context.newX) / context.outerWidth) * 100);

        // TODO : Live updating, requires some more effort to make it good
        //context.taskRecord.percentDone = percent;

        context.percent = context.percentBar.dataset.percent = context.element.dataset.percent = percent;
        context.percentBar.style.width = percent + '%';
    }

    onDragAbort({ context }) {
        // Reset percentBar width on abort
        context.percentBar.style.width = context.taskRecord.percentDone + '%';

        this.cleanup(context);
    }

    onDrop({ context }) {

        context.taskRecord.percentDone = context.percent;
        // Fully overwrite handle style to get rid of translate also
        context.element.style.cssText = `left: ${context.percent}%`;

        this.cleanup(context);
    }

    //endregion

    // No classname on Scheduler's/Gantt's element
    get featureClass() {}
}

GridFeatureManager.registerFeature(PercentBar, false, 'SchedulerPro');
GridFeatureManager.registerFeature(PercentBar, true, 'Gantt');
