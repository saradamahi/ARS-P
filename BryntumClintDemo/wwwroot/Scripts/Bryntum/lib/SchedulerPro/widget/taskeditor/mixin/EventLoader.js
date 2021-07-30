import Container from '../../../../Core/widget/Container.js';

/**
 * @module SchedulerPro/widget/taskeditor/mixin/EventLoader
 */

/**
 * Mixin class for task editor widgets which require record loading functionality
 *
 * @mixin
 */
export default Target => class extends (Target || Container) {

    get project() {
        return this.record?.project;
    }

    loadEvent(record, highlightChanges) {
        this.setRecord(record, highlightChanges);
    }

    resetData() {
        this.record = null;
    }

    beforeSave() {}

    afterSave() {
        this.resetData();
    }

    beforeCancel() {}

    afterCancel() {
        this.resetData();
    }

    beforeDelete() {}

    afterDelete() {
        this.resetData();
    }

    // This does not need a className on Widgets.
    // Each *Class* which doesn't need 'b-' + constructor.name.toLowerCase() automatically adding
    // to the Widget it's mixed in to should implement thus.
    get widgetClass() {}
};
