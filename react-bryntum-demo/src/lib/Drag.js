/**
 * Taken from the vanilla dragfromgrid example
 */
import {
  DateHelper,
  DragHelper,
  DomHelper,
  Rectangle,
  WidgetHelper,
} from "@bryntum/schedulerpro/schedulerpro.umd";

export default class Drag extends DragHelper {
  static get defaultConfig() {
    return {
      // Don't drag the actual row element, clone it
      cloneTarget: true,
      mode: "translateXY",
      // Only allow drops on the schedule area
      dropTargetSelector: ".b-timeline-subgrid",
      // Only allow drag of row elements inside on the unplanned grid
      targetSelector: ".b-grid-row:not(.b-group-row)",
    };
  }

  construct(config) {
    const me = this;

    super.construct(config);

    // Configure DragHelper with schedule's scrollManager to allow scrolling while dragging
    me.scrollManager = me.schedule.scrollManager;

    me.on({
      dragstart: me.onTaskDragStart,
      drag: me.onTaskDrag,
      drop: me.onTaskDrop,
      thisObj: me,
    });
  }

  onTaskDragStart({ context }) {
    const me = this,
      { schedule } = me,
      mouseX = context.clientX,
      proxy = context.element,
      task = me.grid.getRecordFromElement(context.grabbed),
      newWidth = me.schedule.timeAxisViewModel.getDistanceForDuration(
        task.durationMS
      );

    // save a reference to the task so we can access it later
    context.task = task;

    // Mutate dragged element (grid row) into an event bar
    proxy.classList.remove("b-grid-row");
    proxy.classList.add("b-sch-event-wrap");
    proxy.classList.add("b-sch-event");
    proxy.classList.add("b-unassigned-class");
    proxy.classList.add(`b-${schedule.mode}`);
    proxy.innerHTML = `<i class="${task.iconCls}"></i> ${task.name}`;

    // If the new width is narrower than the grabbed element...
    if (context.grabbed.offsetWidth > newWidth) {
      const proxyRect = Rectangle.from(context.grabbed);

      // If the mouse is off (nearly or) the end, centre the element on the mouse
      if (mouseX > proxyRect.x + newWidth - 20) {
        context.newX =
          context.elementStartX =
          context.elementX =
            mouseX - newWidth / 2;
        DomHelper.setTranslateX(proxy, context.newX);
      }
    }

    proxy.style.width = `${newWidth}px`;

    // Prevent tooltips from showing while dragging
    me.schedule.element.classList.add("b-dragging-event");
  }

  onTaskDrag({ context }) {
    const me = this,
      { schedule } = me,
      { task } = context,
      coordinate = DomHelper[
        `getTranslate${schedule.isHorizontal ? "X" : "Y"}`
      ](context.element),
      startDate = schedule.getDateFromCoordinate(coordinate, "round", false),
      endDate =
        startDate &&
        DateHelper.add(startDate, task.duration, task.durationUnit),
      // Coordinates required when used in vertical mode, since it does not use actual columns
      resource =
        context.target && schedule.resolveResourceRecord(context.target);

    // Don't allow drops anywhere, only allow drops if the drop is on the timeaxis and on top of a Resource
    context.valid &=
      Boolean(startDate && resource) &&
      (schedule.allowOverlap ||
        schedule.isDateRangeAvailable(startDate, endDate, null, resource));

    // Save reference to resource so we can use it in onTaskDrop
    context.resource = resource;
  }

  // Drop callback after a mouse up, take action and transfer the unplanned task to the real SchedulerEventStore (if it's valid)
  onTaskDrop({ context }) {
    const me = this,
      task = context.task,
      target = context.target;

    // If drop was done in a valid location, set the startDate and transfer the task to the Scheduler event store
    if (context.valid && target) {
      const date = me.schedule.getDateFromCoordinate(
          DomHelper.getTranslateX(context.element),
          "round",
          false
        ),
        // Try resolving event record from target element, to determine if drop was on another event
        targetEventRecord = me.schedule.resolveEventRecord(context.target);

      if (date) {
        // Remove from grid first so that the data change
        // below does not fire events into the grid.
        me.grid.store.remove(task);

        task.setStartDate(date, true);
        task.assign(context.resource);
        me.schedule.eventStore.add(task);
      }

      // Dropped on a scheduled event, display toast
      if (targetEventRecord) {
        WidgetHelper.toast(`Dropped on ${targetEventRecord.name}`);
      }

      me.context.finalize();
    } else {
      me.abort();
    }

    me.schedule.element.classList.remove("b-dragging-event");
  }
}
