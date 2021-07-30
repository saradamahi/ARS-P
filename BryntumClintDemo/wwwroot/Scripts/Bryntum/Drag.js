import DragHelper from './lib/Core/helper/DragHelper.js';
import DomHelper from './lib/Core/helper/DomHelper.js';
import Rectangle from './lib/Core/helper/util/Rectangle.js';

// Handles dragging unscheduled session from the grid onto the schedule
export default class Drag extends DragHelper {
    static get defaultConfig() {
        return {
            // Don't drag the actual row element, clone it
            cloneTarget: true,
            mode: 'translateXY',
            // Only allow drops on the schedule area
            dropTargetSelector: '.b-timeline-subgrid',
            // Only allow drag of row elements inside on the unplanned grid
            targetSelector: '.b-grid-row:not(.b-group-row)'
        };
    }

    construct(config) {
        super.construct(config);

        this.on({
            dragstart: 'onSessionDragStart',
            drag: 'onSessionDrag',
            drop: 'onSessionDrop',
            thisObj: this
        });
    }

    onSessionDragStart({ context }) {
        const
            me = this,
            { schedule } = me,
            mouseX = context.clientX,
            proxy = context.element,
            appointment = me.grid.getRecordFromElement(context.grabbed),
            newSize = schedule.timeAxisViewModel.getDistanceForDuration(appointment.durationMS);

        // save a reference to the session being dragged so we can access it later
        context.appointment = appointment;

        // Mutate dragged element (grid row) into an event bar
        proxy.classList.remove('b-grid-row');
        proxy.classList.add('b-sch-event-wrap');
        proxy.classList.add('b-sch-style-border');
        proxy.classList.add('b-unassigned-class');
        proxy.innerHTML = `
            <div class="b-sch-event b-has-content b-sch-event-withicon">
                <div class="b-sch-event-content">
                <div>
                    <div>${appointment.name}</div>
                    <span><i></i>Urgency Level: ${appointment.priority}</span>
                </div>
            </div>
        `;

        schedule.enableScrollingCloseToEdges(schedule.timeAxisSubGrid);

        // If the new width is narrower than the grabbed element...
        if (context.grabbed.offsetWidth > newSize) {
            const proxyRect = Rectangle.from(context.grabbed);

            // If the mouse is off (nearly or) the end, centre the element on the mouse
            if (mouseX > proxyRect.x + newSize - 20) {
                context.newX = context.elementStartX = context.elementX = mouseX - newSize / 2;
                DomHelper.setTranslateX(proxy, context.newX);
            }
        }

        proxy.style.width = `${newSize}px`;

        // Prevent tooltips from showing while dragging
        schedule.element.classList.add('b-dragging-event');
    }

    onSessionDrag({ context }) {
        const
            date = this.schedule.getDateFromCoordinate(context.newX, 'round', false),
            technician = context.target && this.schedule.resolveResourceRecord(context.target),
            validationIndicator = context.element.querySelector('i');

        // Don't allow drops everywhere, only allow drops if the drop is on the timeaxis and on top of a room
        if (date && technician) { //} && room.capacity >= context.session.participants) {
            context.valid = true;
            validationIndicator.className = 'b-fa b-fa-fw b-fa-check';
        }
        else {
            context.valid = false;
            validationIndicator.className = 'b-fa b-fa-fw b-fa-times';
        }

        // Save reference to the room so we can use it in onSessionDrop
        context.technician = technician;
    }

    // Drop callback after a mouse up, take action and transfer the unplanned session to the real EventStore (if it's valid)
    async onSessionDrop({ context }) {
        const
            me = this,
            { schedule } = me,
            { appointment, target } = context;

        schedule.disableScrollingCloseToEdges(schedule.timeAxisSubGrid);

        // If drop was done in a valid location, set the startDate and transfer the task to the Scheduler event store
        if (context.valid && target) {
            const
                date = schedule.getDateFromCoordinate(context.newX, 'round', false),
                targetAppointment = schedule.resolveEventRecord(context.target);

            // Suspending refresh to not have multiple redraws from date change and assignments (will animate weirdly)
            schedule.suspendRefresh();

            // Dropped on a scheduled event, create a dependency between them
            if (targetAppointment) {
                schedule.dependencyStore.add({
                    fromEvent: targetAppointment,
                    toEvent: appointment,
                    lag: 30,
                    lagUnit: 'minutes'
                });

                // Color them to signal they are linked
                targetAppointment.eventColor = 'orange';
                appointment.eventColor = 'orange';
            }
            // Dropped on a date, set as startDate
            else if (date) {
                appointment.startDate = date;
            }

            // Assigned to the room (resource) it was dropped on
            appointment.assign(context.technician);

            // Commit changes
            await schedule.project.commitAsync();

            // No longer suspending refresh, all operations have finished
            schedule.resumeRefresh();

            // Redraw, wihout transitions to not delay dependency drawing
            schedule.refresh();

            // Finalize the drag operation
            context.finalize();
        }
        // Dropped somewhere undesired, abort
        else {
            me.abort();
        }

        schedule.element.classList.remove('b-dragging-event');
    }
};