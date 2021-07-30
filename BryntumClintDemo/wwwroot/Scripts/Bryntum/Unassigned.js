import Grid from './lib/Grid/view/Grid.js';

export default class UnplannedGrid extends Grid {
    static get defaultConfig() {
        return {
            features: {
                stripe: true,
                sort: { field: 'serviceOrderId', ascending: false }
            },

            columns: [{
                text: 'ID',
                width: 80,
                field: 'serviceOrderId'
            }, {
                text: 'Problem',
                width: 200,
                field: 'problem'
            }, {
                text: 'Age',
                width: 40,
                field: 'age'
            }, {
                text: 'Name',
                width: 400,
                field: 'name'
            }, {
                text: 'Address',
                width: 200,
                field: 'street'
            }, {
                text: 'City',
                width: 120,
                field: 'city'
            }, {
                text: 'Zip',
                width: 80,
                field: 'zip'
            }, {
                text: 'Event',
                width: 80,
                field: 'event'
            }, {
                text: 'SL',
                width: 50,
                field: 'serviceLine'
            }, {
                text: 'ST',
                width: 50,
                field: 'serviceType'
            }, {
                text: 'SRC',
                width: 100,
                field: 'source'
            }, {
                text: 'Due',
                width: 150,
                field: 'due'
            }, {
                text: 'Tech',
                width: 150,
                field: 'technician'
            }, {
                text: 'Priority',
                width: 150,
                field: 'priority'
            }, {
                text: 'Elapsed',
                width: 80,
                field: 'elapsed'
            }, {
                text: 'Codes',
                flex: 1,
                field: 'codes'
            }],

            rowHeight: 30,

            disableGridRowModelWarning: true
        };
    }

    static get $name() {
        return 'UnplannedGrid';
    }

    set project(project) {
        // Create a chained version of the event store as our store. It will be filtered to only display events that
        // lack assignments
        this.store = project.eventStore.chain(eventRecord => !eventRecord.assignments.length);

        // When assignments change, update our chained store to reflect the changes
        project.assignmentStore.on({
            change() {
                this.store.fillFromMaster();
            },
            thisObj: this
        });
    }
};