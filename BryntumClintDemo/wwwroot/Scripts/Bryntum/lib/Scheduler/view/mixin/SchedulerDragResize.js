import Base from '../../../Core/Base.js';

/**
 * @module Scheduler/view/mixin/SchedulerDragResize
 */

/**
 * Mixin for triggering event editor on drag creation etc.
 * @private
 * @mixin
 */
export default Target => class SchedulerDragResize extends (Target || Base) {
    static get $name() {
        return 'SchedulerDragResize';
    }

    construct(config) {
        super.construct(config);

        if (this.hasFeature('eventDragCreate')) {
            this.on({
                dragCreateEnd : 'internalOnDragCreateEnd',
                thisObj       : this
            });
        }
    }

    internalOnDragCreateEnd({ newEventRecord : eventRecord, resourceRecord }) {
        const me = this;

        // If an event editor is defined and enabled, it has to manage how/if/when the event is added to the event store
        if (
            // Scheduler or Scheduler Pro using `eventEdit`
            (!me.hasFeature('simpleEventEdit') || me.features.simpleEventEdit.disabled) &&
            (!me.hasFeature('eventEdit') || me.features.eventEdit.disabled) &&
            // Scheduler Pro using `taskEdit`
            (!me.hasFeature('taskEdit') || me.features.taskEdit.disabled)
        ) {
            const resources = resourceRecord ? [resourceRecord] : [];

            // resources **Deprecated 4.0** Use `resourceRecords` instead
            if (me.trigger('beforeEventAdd', { eventRecord, resources, resourceRecords : resources }) !== false) {
                me.onEventCreated(eventRecord);
                me.eventStore.add(eventRecord);

                eventRecord.assign(resourceRecord);
            }
        }
    }

    // This does not need a className on Widgets.
    // Each *Class* which doesn't need 'b-' + constructor.name.toLowerCase() automatically adding
    // to the Widget it's mixed in to should implement thus.
    get widgetClass() {}
};
