import SchedulerPro from './lib/SchedulerPro/view/SchedulerPro.js';
import DateHelper from './lib/Core/helper/DateHelper.js';


export default class Schedule extends SchedulerPro {
    static get type() {
        return 'schedule';
    }
    
    static get $name() {
        return 'Schedule';
    }

    static get defaultConfig() {
        return {
            barMargin: 2,
            autoHeight: false,
            rowHeight: 40,
            fillTicks: false,
            snap: false,
            allowOverlap: true,
            eventLayout: 'none',
            features: {
                stripe: true,
                group: 'primaryDisciplineName',
                timeRanges: {
                    showHeaderElements: true,
                    showCurrentTimeLine: true
                },
                dependencies: {
                    disabled: true
                },
                dependencyEdit: {
                    disabled: true
                },
                eventMenu: {
                    items: {
                        openServiceOrder: {
                            text: 'Open Service Order...',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        openServiceLocation: {
                            text: 'Open Service Location...',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        openResource: {
                            text: 'Open Resource...',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        changeEvent: {
                            text: 'Change Event...',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        deleteAppointment: {
                            text: 'Delete Appointment',
                            cls: 'b-separator',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        deleteAllAppointments: {
                            text: 'Delete All Appointments',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        freezeAppointment: {
                            text: 'Freeze Appointment',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        rescheduleServiceOrder: {
                            text: 'Reschedule Service Order...',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        finishServiceOrder: {
                            text: 'Finish Service Order...',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        serviceConfirmed: {
                            text: 'Service Confirmed',
                            cls: 'b-separator',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        sendEmailText: {
                            text: 'Send Email/Text',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        newPurchaseOrder: {
                            text: 'New Purchase Order...',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        serviceOrderNotes: {
                            text: 'Service Order Notes...',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        issueInventory: {
                            text: 'Issue Inventory',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        serviceOrderDetails: {
                            text: 'Service Order Details...',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        viewServiceHistory: {
                            text: 'View Service History',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        refresh: {
                            text: 'Refresh',
                            cls: 'b-separator',
                            weight: 500,
                            onItem({ eventRecord }) {
                                //eventRecord.startDate = DateHelper.add(eventRecord.startDate, -1, 'hour');
                            }
                        },
                        // Hide a built in item
                        deleteEvent: false
                    }
                }
            },
            eventStyle: 'plain',
            eventColor: 'indigo',
            columns: [
                {
                    type: 'resourceInfo',
                    text: 'Resources',
                    field: 'alias',
                    width: 300
                }
            ],
            tbar: [
                {
                    type: 'datefield',
                    ref: 'dateField',
                    width: 190,
                    editable: false,
                    step: 1,
                    onChange: 'up.onDateFieldChange'
                }
            ],
            viewPreset: 'hourAndDay',
            resourceImagePath: './Scripts/Bryntum/_shared/images/users/',
            scrollable: true,
            tickSize: 100
        };
    }

    construct() {
        super.construct(...arguments);

        this.widgetMap.dateField.value = this.startDate;

    }

    onDateFieldChange({ value }) {
        this.setTimeSpan(DateHelper.add(value, 0, 'hour'), DateHelper.add(value, 24, 'hour'));
        
        var startDate = new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 0, 0);
        this.scrollToDate(startDate);
    }

    onPrevious() {
        this.shiftPrevious();
    }

    onNext() {
        this.shiftNext();
    }
}

Schedule.initClass();