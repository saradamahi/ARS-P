/* eslint-disable no-unused-expressions */
/**
 * @module Scheduler/crud/mixin/CrudManagerView
 */

import LoadMaskable from '../../../Core/mixin/LoadMaskable.js';
import Mask from '../../../Core/widget/Mask.js';

/**
 * This mixin provides helpful Crud Manager functionality.
 *
 * The class mixing it in should draw its `eventStore` from the instantiated CrudManager's eventStore.
 *
 * It adds {@link Scheduler.crud.mixin.CrudManagerView#config-crudManager} config allowing to provide a Crud Manager
 * either as a class instance or as a configuration object (for later the mixin provides
 * {@link Scheduler.crud.mixin.CrudManagerView#config-crudManagerClass} config defining which class should be
 * instantiated).
 *
 * The mixin also tracks Crud Manager requests to the server and masks the view during them. For masking it
 * uses the {@link Core.mixin.LoadMaskable#config-loadMask} and {@link Core.mixin.LoadMaskable#config-syncMask}
 * properties.
 *
 * @mixin
 * @extends Core/mixin/LoadMaskable
 */
export default Target => class CrudManagerView extends Target.mixin(LoadMaskable) {
    //region Config

    static get $name() {
        return 'CrudManagerView';
    }

    static get configurable() {
        return {
            /**
             * Class that should be used to instantiate a CrudManager in case it's provided as a simple object to
             * {@link Scheduler.crud.mixin.CrudManagerView#config-crudManager} config.
             * @config {Scheduler.crud.AbstractCrudManagerMixin}
             * @category Data
             */
            crudManagerClass : null,

            /**
             * Supply a {@link Scheduler.data.CrudManager CrudManager} instance or a config object if you want to use
             * CrudManager for handling data.
             * @config {Object|Scheduler.crud.AbstractCrudManagerMixin}
             * @category Data
             */
            crudManager : null
        };
    }

    //endregion

    /**
     * Get/set the CrudManager instance
     * @member {Scheduler.data.CrudManager} crudManager
     * @category Data
     */

    //region Init

    afterConstruct() {
        const
            me = this,
            { crudManager } = me;

        super.afterConstruct();

        if (crudManager && me.loadMask && crudManager.isCrudManagerLoading) {
            // Show loadMask if crud manager is already loading
            me.onCrudManagerLoadStart();
        }
    }

    //endregion

    /**
     * Applies the {@link Scheduler.crud.mixin.CrudManagerView#config-syncMask} as the
     * {@link Core.widget.Widget#config-masked mask} for this widget.
     * @internal
     */
    applySyncMask() {
        const
            me = this,
            { syncMask } = me;

        if (syncMask) {
            me.masked = Mask.mergeConfigs(me.loadMaskDefaults, syncMask);
        }
    }

    /**
     * Hooks up crud manager listeners
     * @private
     * @category Store
     */
    bindCrudManager(crudManager) {
        this.detachListeners('crudManager');

        crudManager?.on({
            name         : 'crudManager',
            loadStart    : 'onCrudManagerLoadStart',
            load         : 'onCrudManagerLoad',
            loadCanceled : 'onCrudManagerLoadCanceled',
            syncStart    : 'onCrudManagerSyncStart',
            sync         : 'onCrudManagerSync',
            syncCanceled : 'onCrudManagerSyncCanceled',
            requestFail  : 'onCrudManagerRequestFail',
            thisObj      : this
        });
    }

    onCrudManagerLoadStart() {
        // Show loadMask before crud manager starts loading
        this.applyLoadMask();
        this.toggleEmptyText();
    }

    onCrudManagerSyncStart() {
        this.applySyncMask();
    }

    onCrudManagerRequestFinalize(successful = true, requestType, response) {
        const me = this;

        if (successful) {
            me.masked = null;
            me.toggleEmptyText();
        }
        else {
            // Do not remove. Assertion strings for Localization sanity check.
            // 'L{GridBase.loadFailedMessage}'
            // 'L{GridBase.syncFailedMessage}'

            me.applyMaskError(
                `<div class="b-grid-load-failure">
                    <div class="b-grid-load-fail">${me.L(`L{GridBase.${requestType}FailedMessage}`)}</div>
                    ${response && response.message ? `<div class="b-grid-load-fail">${me.L('L{CrudManagerView.serverResponseLabel}')} ${response.message}</div>` : ''}
                </div>`);
        }
    }

    onCrudManagerLoadCanceled() {
        this.onCrudManagerRequestFinalize();
    }

    onCrudManagerSyncCanceled() {
        this.onCrudManagerRequestFinalize();
    }

    onCrudManagerLoad() {
        this.onCrudManagerRequestFinalize();
    }

    onCrudManagerSync() {
        this.onCrudManagerRequestFinalize();
    }

    onCrudManagerRequestFail({ requestType, response }) {
        this.onCrudManagerRequestFinalize(false, requestType, response);
    }

    changeCrudManager(crudManager) {
        const me = this;

        if (crudManager && !crudManager.isCrudManager) {
            //<debug>
            if (!me.crudManagerClass) {
                throw new Error('No CrudManager class configured on CrudManager\'s View');
            }
            //</debug>

            // CrudManager injects itself into is Scheduler's _crudManager property
            // because code it triggers needs to access it through its getter.
            crudManager = me.crudManagerClass.new({
                scheduler : me
            }, crudManager);
        }
        // config setter will veto because of above described behaviour
        // of setting the property early on creation
        me._crudManager = crudManager;

        me.bindCrudManager(crudManager);
    }

    get widgetClass() {}
};
