import EventModel from './lib/SchedulerPro/model/EventModel.js';

// Custom Appointment model, based on EventModel with additional fields and changed default
export default class Appointment extends EventModel {
    static get fields() {
        return [
            { name: 'serviceOrderId' },
            { name: 'problem' },
            { name: 'age' },
            { name: 'street' },
            { name: 'city' },
            { name: 'state' },
            { name: 'zip' },
            { name: 'event' },
            { name: 'serviceLine' },
            { name: 'serviceType' },
            { name: 'source' },
            { name: 'due' },
            { name: 'technician' },
            { name: 'priority' },
            { name: 'elapsed' },
            { name: 'codes' },
            { name: 'address', defaultValue: {} }
        ];
    }

    static get defaults() {
        return {
            durationUnit: 'h'
        };
    }
}