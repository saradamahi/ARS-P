import Base from '../../../Core/Base.js';

/**
 * @module SchedulerPro/feature/mixin/ProTaskEditStm
 */

/**
 * Mixin adding STM transactable behavior to TaskEdit feature.
 *
 * @mixin
 */
export default Target => class TaskEditStm extends (Target || Base) {
    static get $name() {
        return 'TaskEditStm';
    }

    captureStm() {
        const
            me      = this,
            project = me.project,
            stm     = project.getStm();

        me.stmInitiallyDisabled = stm.disabled;
        me.stmInitiallyAutoRecord = stm.autoRecord;

        if (me.stmInitiallyDisabled) {
            stm.enable();
            // it seems this branch has never been exercised by tests
            // but the intention is to stop the auto-recording while
            // task editor is active (all editing is one manual transaction)
            stm.autoRecord = false;
        }
        else {
            if (me.stmInitiallyAutoRecord) {
                stm.autoRecord = false;
            }
            if (stm.isRecording) {
                stm.stopTransaction();
            }
        }
    }

    startStmTransaction() {
        // TODO: Create title: "Editing event/task 'name'"
        this.project.getStm().startTransaction();
    }

    commitStmTransaction() {
        const
            me  = this,
            stm = me.project.getStm();

        stm.stopTransaction();

        if (me.stmInitiallyDisabled) {
            stm.resetQueue();
        }
    }

    async rejectStmTransaction() {
        const
            stm        = this.project.getStm(),
            { client } = this;

        if (stm.transaction.length) {
            client.suspendRefresh();

            stm.forEachStore(s => s.beginBatch());

            stm.rejectTransaction();

            stm.forEachStore(s => s.endBatch());

            await client.resumeRefresh(true);
        }
        else {
            stm.stopTransaction();
        }
    }

    enableStm() {
        this.project.getStm().enable();
    }

    disableStm() {
        this.project.getStm().disable();
    }

    freeStm() {
        const
            me  = this,
            stm = me.project.getStm();

        stm.disabled = me.stmInitiallyDisabled;
        stm.autoRecord = me.stmInitiallyAutoRecord;
    };
};
