import Base from '../../../Core/Base.js';

// TODO: Compare with Schedulers ProjectModel, make similar

/**
 * @module SchedulerPro/data/mixin/PartOfProject
 */

const throwIfNotTheSameStore = (oldStore, newStore) => {
    if (oldStore !== newStore) {
        throw new Error('Store set is prohibited for Scheduler Pro entity!');
    }
};

/**
 * This is a mixin, included in all models and stores of the Scheduler Pro project. It provides a common API for accessing
 * all stores of the project.
 *
 * @typings Scheduler/data/mixin/PartOfProject -> Scheduler/data/mixin/SchedulerPartOfProject
 *
 * @mixin
 */
export default Target => class PartOfProject extends (Target || Base) {
    static get $name() {
        return 'PartOfProject';
    }

    /**
     * Returns the project this entity belongs to.
     *
     * @member {SchedulerPro.model.ProjectModel} project
     * @readonly
     */

    /**
     * An {@link SchedulerPro.data.EventStore} instance or a config object.
     * @config {SchedulerPro.data.EventStore|Object} taskStore
     * @category Project
     */
    /**
     * The {@link SchedulerPro.data.EventStore store} holding the events information.
     *
     * @member {SchedulerPro.data.EventStore}
     * @category Project
     * @readonly
     */
    get taskStore() {
        return this.eventStore;
    }

    // this setter actually does nothing, intentionally, setting the stores on other stores is deprecated
    set taskStore(store) {
        this.eventStore = store;
    }

    /**
     * Returns the task store of the project this entity belongs to.
     *
     * @property {SchedulerPro.data.EventStore}
     * @category Project
     * @readonly
     * @typings Scheduler/model/mixin/ProjectModelMixin:eventStore -> {Scheduler.data.EventStore|SchedulerPro.data.EventStore}
     */
    get eventStore() {
        return this.project?.eventStore;
    }

    get leftProjectEventStore() {
        const project = this.leftProject;
        return project?.getEventStore() || null;
    }

    // this setter actually does nothing, intentionally, setting the stores on other stores is deprecated
    set eventStore(store) {
        throwIfNotTheSameStore(this.eventStore, store);
    }

    /**
     * Returns the dependency store of the project this entity belongs to.
     *
     * @property {SchedulerPro.data.DependencyStore}
     * @category Project
     * @readonly
     * @typings Scheduler/model/mixin/ProjectModelMixin:dependencyStore -> {Scheduler.data.DependencyStore|SchedulerPro.data.DependencyStore}
     */
    get dependencyStore() {
        return this.project?.dependencyStore;
    }

    // this setter actually does nothing, intentionally, setting the stores on other stores is deprecated
    set dependencyStore(store) {
        throwIfNotTheSameStore(this.dependencyStore, store);
    }

    /**
     * Returns the assignment store of the project this entity belongs to.
     *
     * @property {SchedulerPro.data.AssignmentStore}
     * @readonly
     * @category Project
     * @typings Scheduler/model/mixin/ProjectModelMixin:assignmentStore -> {Scheduler.data.AssignmentStore|SchedulerPro.data.AssignmentStore}
     */
    get assignmentStore() {
        return this.project?.assignmentStore;
    }

    // this setter actually does nothing, intentionally, setting the stores on other stores is deprecated
    set assignmentStore(store) {
        throwIfNotTheSameStore(this.assignmentStore, store);
    }

    /**
     * Returns the resource store of the project this entity belongs to.
     *
     * @property {SchedulerPro.data.ResourceStore}
     * @readonly
     * @category Project
     * @typings Scheduler/model/mixin/ProjectModelMixin:resourceStore -> {Scheduler.data.ResourceStore|SchedulerPro.data.ResourceStore}
     */
    get resourceStore() {
        return this.project?.resourceStore;
    }

    // this setter actually does nothing, intentionally, setting the stores on other stores is deprecated
    set resourceStore(store) {
        throwIfNotTheSameStore(this.resourceStore, store);
    }

    /**
     * Returns the calendar manager store of the project this entity belongs to.
     *
     * @property {SchedulerPro.data.CalendarManagerStore}
     * @readonly
     * @category Project
     */
    get calendarManagerStore() {
        return this.project?.calendarManagerStore;
    }

    // this setter actually does nothing, intentionally, setting the stores on other stores is deprecated
    set calendarManagerStore(store) {
        throwIfNotTheSameStore(this.calendarManagerStore, store);
    }
};
