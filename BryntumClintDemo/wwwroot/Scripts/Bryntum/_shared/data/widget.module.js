// eslint-disable-next-line no-unused-vars
window.introWidget = {
    type       : 'schedulerpro',
    minHeight  : 250,
    readOnly   : true,
    startDate  : new Date(2021, 1, 14, 7),
    endDate    : new Date(2021, 1, 14, 11, 30),
    viewPreset : 'hourAndDay',
    rowHeight  : 50,
    columns    : [
        {
            type     : 'template',
            text     : 'Name',
            field    : 'name',
            cellCls  : 'name',
            template : data => `<img src="_shared/images/users/${data.record.name.toLowerCase()}.jpg" alt=""/><dl><dt>${data.record.name}</dt><dd>${data.record.events.length} task(s)</dd></dl>`,
            width    : '10em'
        }
    ],

    project : {
        resourcesData : [
            { id : 1, name : 'Henrik' },
            { id : 2, name : 'Linda' },
            { id : 3, name : 'Rob' },
            { id : 4, name : 'Hitomi' }
        ],
        eventsData : [
            {
                id           : 1,
                startDate    : new Date(2021, 1, 14, 7, 30),
                duration     : 1.5,
                durationUnit : 'h',
                name         : 'Workout',
                eventColor   : 'orange'
            },
            {
                id           : 2,
                startDate    : new Date(2021, 1, 14, 8),
                endDate      : new Date(2021, 1, 14, 10, 30),
                duration     : 1,
                durationUnit : 'h',
                name         : 'Meeting',
                eventColor   : 'blue'
            },
            {
                id        : 3,
                startDate : new Date(2021, 1, 14, 8),
                duration  : 0,
                name      : 'Morning briefing'
            },
            {
                id           : 4,
                startDate    : new Date(2021, 1, 14, 7, 30),
                duration     : 2,
                durationUnit : 'h',
                name         : 'Prepare presentation',
                eventColor   : 'purple'
            }
        ],
        assignmentsData : [
            { resource : 1, event : 1 },
            { resource : 2, event : 2 },
            { resource : 3, event : 3 },
            { resource : 4, event : 4 }
        ],
        dependenciesData : [
            {
                fromEvent : 1,
                toEvent   : 2,
                lag       : 1,
                lagUnit   : 'h'
            },
            {
                fromEvent : 4,
                toEvent   : 2,
                lag       : 1,
                lagUnit   : 'h'
            }

        ]
    }

};
