import WidgetTag from '../../Core/customElements/WidgetTag.js';

/**
 * @module Scheduler/customElements/TimelineBaseTag
 */

/**
 * Abstract base class for SchedulerTag, SchedulerProTag and GanttTag.
 *
 * @extends Core/customElements/WidgetTag
 * @abstract
 */

export default class TimelineBaseTag extends WidgetTag {
    createInstance(config) {
        const
            me         = this,
            columns    = [],
            resources  = [],
            events     = [];

        // create columns and data
        for (const tag of me.children) {
            if (tag.tagName === 'COLUMN') {
                const
                    width  = parseInt(tag.dataset.width),
                    flex   = parseInt(tag.dataset.flex),
                    column = {
                        field : tag.dataset.field,
                        text  : tag.innerHTML,
                        type  : tag.dataset.type
                    };

                if (width) column.width = width;
                else if (flex) column.flex = flex;
                else column.flex = 1;

                columns.push(column);
            }
            else if (tag.tagName === 'DATA') {
                for (const storeType of tag.children) {
                    for (const record of storeType.children) {
                        const row = {};

                        Object.assign(row, record.dataset);

                        if (storeType.tagName === 'EVENTS') {
                            events.push(row);
                        }
                        else if (storeType.tagName === 'RESOURCES') {
                            resources.push(row);
                        }
                    }
                }
            }
            else if (tag.tagName === 'PROJECT') {
                config.project = new this.projectModelClass({
                    autoLoad  : true,
                    transport : {
                        load : {
                            url : tag.dataset.loadUrl
                        }
                    }
                });
            }
        }

        // Gantt gets mad if both project and inline data is supplied
        if (events.length) {
            config.events = events;
        }

        if (resources.length) {
            config.resources = resources;
        }

        return new this.widgetClass(Object.assign(config, {
            columns
        }));
    }
}
