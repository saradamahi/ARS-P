import AjaxStore from '../../Core/data/AjaxStore.js';
import PartOfProject from './mixin/PartOfProject.js';
import CalendarModel from '../model/CalendarModel.js';
import { ChronoCalendarManagerStoreMixin } from '../../Engine/quark/store/ChronoCalendarManagerStoreMixin.js';

/**
 * @module SchedulerPro/data/CalendarManagerStore
 */

/**
 * A class representing the tree of calendars in the SchedulerPro chart. An individual calendar is represented as an instance of the
 * {@link SchedulerPro.model.CalendarModel} class. The store expects the data loaded to be hierarchical. Each parent node should
 * contain its children in a property called 'children'.
 *
 * Please refer to the [calendars guide](#guides/schedulerpro/calendars.md) for details
 *
 * @mixes SchedulerPro/data/mixin/PartOfProject
 *
 * @extends Core/data/AjaxStore
 */
export default class CalendarManagerStore extends PartOfProject(ChronoCalendarManagerStoreMixin.derive(AjaxStore)) {

    //region Config

    static get defaultConfig() {
        return {
            tree         : true,
            modelClass   : CalendarModel,
            /**
             * CrudManager must load stores in the correct order. Lowest first.
             * @private
             */
            loadPriority : 100,
            /**
             * CrudManager must sync stores in the correct order. Lowest first.
             * @private
             */
            syncPriority : 100,
            storeId      : 'calendars'
        };
    }

    //endregion

};
