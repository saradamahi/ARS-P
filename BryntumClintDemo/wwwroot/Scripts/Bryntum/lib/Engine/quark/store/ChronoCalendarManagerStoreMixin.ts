import { AnyConstructor, Mixin } from "../../../ChronoGraph/class/BetterMixin.js"
import { BaseCalendarMixin } from "../model/scheduler_basic/BaseCalendarMixin.js"
import { SchedulerBasicProjectMixin } from "../model/scheduler_basic/SchedulerBasicProjectMixin.js"
import { ChronoPartOfProjectStoreMixin } from "./mixin/ChronoPartOfProjectStoreMixin.js"
import { AbstractCalendarManagerStoreMixin } from "./AbstractCalendarManagerStoreMixin.js"


/**
 * A store mixin class, that represent collection of all calendars in the [[SchedulerBasicProjectMixin|project]].
 */
export class ChronoCalendarManagerStoreMixin extends Mixin(
    [ AbstractCalendarManagerStoreMixin, ChronoPartOfProjectStoreMixin ],
    (base : AnyConstructor<AbstractCalendarManagerStoreMixin & ChronoPartOfProjectStoreMixin, typeof AbstractCalendarManagerStoreMixin & typeof ChronoPartOfProjectStoreMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class ChronoCalendarManagerStoreMixin extends base {

        project             : SchedulerBasicProjectMixin

        modelClass          : this[ 'project' ][ 'calendarModelClass' ]


        static get defaultConfig () {
            return {
                tree            : true,
                modelClass      : BaseCalendarMixin
            }
        }
    }

    return ChronoCalendarManagerStoreMixin
}){}
