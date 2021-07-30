import DomHelper from '../../Core/helper/DomHelper.js';
import SchedulerBase from '../../Scheduler/view/SchedulerBase.js';
import ProjectModel from '../model/ProjectModel.js';
import VersionHelper from '../../Core/helper/VersionHelper.js';
import '../localization/En.js';

/**
 * @module SchedulerPro/view/SchedulerProBase
 */

/**
 * A thin base class for {@link SchedulerPro.view.SchedulerPro}. Includes fewer features by default, allowing smaller
 * custom built bundles if used in place of {@link SchedulerPro.view.SchedulerPro}.
 *
 * **NOTE:** In most scenarios you should use SchedulerPro instead of SchedulerProBase.
 *
 * @extends Scheduler/view/SchedulerBase
 */
export default class SchedulerProBase extends SchedulerBase {

    //region Config

    static get $name() {
        return 'SchedulerProBase';
    }

    static get type() {
        return 'schedulerprobase';
    }

    static get configurable() {
        return {
            projectModelClass : ProjectModel
        };
    }

    static get isSchedulerPro() {
        return true;
    }

    //endregion

    //region Internal

    // Overrides grid to take project loading into account
    toggleEmptyText() {
        const
            me = this;
        if (me.bodyContainer) {
            DomHelper.toggleClasses(me.bodyContainer, 'b-grid-empty', !(me.rowManager.rowCount || me.project.isLoadingOrSyncing));
        }
    }

    // Needed to work with Gantt features
    get taskStore() {
        return this.project.eventStore;
    }

    //endregion

    internalAddEvent(startDate, resourceRecord, row) {
        // If task editor is active dblclick will trigger number of async actions:
        // store add which would schedule project commit
        // editor cancel on next animation frame
        // editor hide
        // rejecting previous transaction
        // and there is also dependency feature listening to transitionend on scheduler to draw lines after
        // It can happen that user dblclicks too fast, then event will be added, then dependency will schedule itself
        // to render, and then event will be removed as part of transaction rejection from editor. So we cannot add
        // event before active transaction is done.
        if (this.taskEdit && this.taskEdit.isEditing) {
            this.on({
                aftertaskedit : () => super.internalAddEvent(startDate, resourceRecord, row),
                once          : true
            });
        }
        else {
            return super.internalAddEvent(startDate, resourceRecord, row);
        }
    }
}

SchedulerProBase.initClass();
VersionHelper.setVersion('schedulerpro', '4.1.0');
