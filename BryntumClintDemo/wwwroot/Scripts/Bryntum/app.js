import Splitter from './lib/Core/widget/Splitter.js';
import Drag from './Drag.js';
import MapPanel from './MapPanel.js';
import Schedule from './Schedule.js';
import Technician from './Technician.js';
import Appointment from './Appointment.js';
import Unassigned from './Unassigned.js';
import './lib/Scheduler/column/ResourceInfoColumn.js';
import './lib/Scheduler/feature/TimeRanges.js';

const currentDate = new Date();
const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 7, 0, 0);
const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 21, 0, 0);

const schedule = new Schedule({
    ref: 'schedule',
    insertFirst: 'main',
    //flex: '1 1 75%',
    flex: 4,
    startDate: startDate,
    endDate: endDate,
    visibleDate: currentDate,
    
    project: {
        autoLoad: true,
        resourceModelClass: Technician,
        eventModelClass: Appointment,
        resourceStore: {
            storeId: 'technicians'
        },
        eventStore: {
            storeId: 'appointments',
            removeUnassignedEvent: false
        },
        calendarStore: {
            storeId: 'calendars'
        },
        transport: {
            load: {
                url: '/ScheduleBoard/Scripts/Bryntum/data/data.json'
            }
        }
    },
    listeners: {
        eventClick: ({ eventRecord }) => {
            // When an event bar is clicked, bring the marker into view and show a tooltip
            if (eventRecord.marker) {
                mapPanel.showTooltip(eventRecord, true);
            }
        },

        afterEventSave: ({ eventRecord }) => {
            if (eventRecord.marker) {
                mapPanel.scrollMarkerIntoView(eventRecord);
            }
        }
    }
});

const splitter = new Splitter({
    appendTo: 'container'
});

const unassignedGrid = new Unassigned({
    ref: 'unplanned',
    appendTo: 'container',
    flex: '1 1 25%',
    project: schedule.project
});

// Handles dragging
const drag = new Drag({
    grid: unassignedGrid,
    schedule: schedule,
    constrain: false,
    outerElement: unassignedGrid.element
});

// A draggable splitter between the two main widgets
new Splitter({
    appendTo: 'main'
});

const mapPanel = new MapPanel({
    ref: 'map',
    appendTo: 'main',
    flex: 1,
    eventStore: schedule.eventStore,
    timeAxis: schedule.timeAxis,
    listeners: {
        // When a map marker is clicked, scroll the event bar into view and highlight it
        markerclick: async ({ eventRecord }) => {
            await schedule.scrollEventIntoView(eventRecord, { animate: true, highlight: true });
            schedule.selectedEvents = [eventRecord];
        }
    }
});
