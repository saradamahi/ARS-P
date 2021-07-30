import DragCreateBase from './base/DragCreateBase.js';
import GridFeatureManager from '../../Grid/feature/GridFeatureManager.js';

/**
 * @module Scheduler/feature/EventDragCreate
 */

/**
 * Feature that allows the user to create new events by dragging in empty parts of the scheduler rows.
 *
 * This feature is **enabled** by default
 *
 * **NOTE:** Incompatible with the {@link Scheduler.feature.EventDragSelect EventDragSelect} and the {@link Scheduler.feature.Pan Pan} features.
 *
 * @extends Scheduler/feature/base/DragCreateBase
 * @demo Scheduler/basic
 * @externalexample scheduler/EventDragCreate.js
 * @classtype eventDragCreate
 * @feature
 */
export default class EventDragCreate extends DragCreateBase {
    //region Config

    static get $name() {
        return 'EventDragCreate';
    }

    static get defaultConfig() {
        return {
            /**
             * An empty function by default, but provided so that you can perform custom validation on the event being created.
             * Return true if the new event is valid, false to prevent an event being created.
             * @param {Object} context A drag create context
             * @param {Date} context.startDate Event start date
             * @param {Date} context.endDate Event end date
             * @param {Scheduler.model.EventModel} context.record Event record
             * @param {Scheduler.model.ResourceModel} context.resourceRecord Resource record
             * @param {Event} event The event object
             * @return {Boolean} `true` if this validation passes
             * @config {function}
             */
            validatorFn : () => {}
        };
    }

    //endregion

    //region Events

    /**
     * Fires on the owning Scheduler after the new event has been created.
     * @event dragCreateEnd
     * @on-owner
     * @param {Scheduler.view.Scheduler} source
     * @param {Scheduler.model.EventModel} newEventRecord
     * @param {Scheduler.model.ResourceModel} resourceRecord
     * @param {MouseEvent} event The ending mouseup event.
     * @param {HTMLElement} proxyElement The proxy element showing the drag creation zone.
     */

    /**
     * Fires on the owning Scheduler at the beginning of the drag gesture
     * @event beforeDragCreate
     * @on-owner
     * @param {Scheduler.view.Scheduler} source
     * @param {Scheduler.model.ResourceModel} resourceRecord
     * @param {Date} date The datetime associated with the drag start point.
     */

    /**
     * Fires on the owning Scheduler after the drag start has created a proxy element.
     * @event dragCreateStart
     * @on-owner
     * @param {Scheduler.view.Scheduler} source
     * @param {HTMLElement} proxyElement The proxy representing the new event.
     */

    /**
     * Fired on the owning Scheduler to allow implementer to prevent immediate finalization by setting `data.context.async = true`
     * in the listener, to show a confirmation popup etc
     * ```
     *  scheduler.on('beforedragcreatefinalize', ({context}) => {
     *      context.async = true;
     *      setTimeout(() => {
     *          // async code don't forget to call finalize
     *          context.finalize();
     *      }, 1000);
     *  })
     * ```
     * @event beforeDragCreateFinalize
     * @on-owner
     * @param {Scheduler.view.Scheduler} source Scheduler instance
     * @param {HTMLElement} proxyElement Proxy element, representing future event
     * @param {Object} context
     * @param {Boolean} context.async Set true to handle drag create asynchronously (e.g. to wait for user
     * confirmation)
     * @param {Function} context.finalize Call this method to finalize drag create. This method accepts one
     * argument: pass true to update records, or false, to ignore changes
     */

    /**
     * Fires on the owning Scheduler at the end of the drag create gesture whether or not
     * a new event was created by the gesture.
     * @event afterDragCreate
     * @on-owner
     * @param {Scheduler.view.Scheduler} source
     * @param {HTMLElement} proxyElement The proxy element showing the drag creation zone.
     */

    //endregion

    //region Init

    construct(scheduler, config) {
        this.scheduler = scheduler;

        super.construct(scheduler, config);
    }

    get store() {
        return this.scheduler.eventStore;
    }

    //endregion

    //region Scheduler specific implementation

    finalizeDragCreate(context) {
        const newEventRecord = new this.store.modelClass({
            startDate : context.startDate,
            // Needed to force engine to calculate duration even if there is a defaultValue specified
            duration  : null,
            endDate   : context.endDate
        });

        this.proxy.dataset.eventId = newEventRecord.id;

        this.scheduler.trigger('dragCreateEnd', {
            newEventRecord,
            resourceRecord : context.rowRecord,
            event          : context.event,
            proxyElement   : this.proxy
        });
    }

    handleBeforeDragCreate(dateTime, event) {
        const
            me     = this,
            result = me.scheduler.trigger('beforeDragCreate', {
                resourceRecord : me.createContext.rowRecord,
                date           : dateTime,
                event
            });

        if (result) {
            // Tooltip will not be activated while drag is in progress,
            // but we need to hide it deliberately on drag start
            const tipFeature = me.scheduler.features.scheduleTooltip;
            tipFeature?.hoverTip?.hide();
        }

        // Save date constraints
        me.dateConstraints = me.scheduler.getDateConstraints(me.createContext.rowRecord, dateTime);

        return result;
    }

    checkValidity(context, event) {
        const
            me         = this,
            { client } = me;

        // Nicer for users of validatorFn
        context.resourceRecord = context.rowRecord;
        return (
            client.allowOverlap ||
            client.isDateRangeAvailable(context.startDate, context.endDate, null, context.resourceRecord)
        ) && me.validatorFn.call(me.validatorFnThisObj || me, context, event);
    }

    // Determine if resource already has events or not
    isRowEmpty(resourceRecord) {
        const events = this.store.getEventsForResource(resourceRecord);
        return !events || !events.length;
    }

    //endregion
}

GridFeatureManager.registerFeature(EventDragCreate, true, 'Scheduler');
GridFeatureManager.registerFeature(EventDragCreate, false, 'ResourceHistogram');
