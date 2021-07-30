import ResourceModel from './lib/SchedulerPro/model/ResourceModel.js';

// Custom Room model, based on ResourceModel with additional fields
export default class Technician extends ResourceModel {
    static get fields() {
        return [
            'resourceTypeId',
            'currentEventTypeId',
            'currentEventType',
            'statusId',
            'primaryDisciplineId', 
            'primaryDisciplineName',
            'alias'
        ];
    }
}