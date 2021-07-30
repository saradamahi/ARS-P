import Combo from '../../Core/widget/Combo.js';
import Store from '../../Core/data/Store.js';

/**
 * @module SchedulerPro/widget/ConstraintTypePicker
 */

/**
 * Combo box preconfigured with possible scheduling mode values. This picker doesn't support {@link Core/widget/Combo#config-multiSelect multiSelect}.
 *
 * This field can be used as an editor for a {@link Grid.column.Column Column}.
 * It is used as the default editor for the `ConstraintTypeColumn` in the Gantt chart.
 *
 * {@inlineexample schedulerpro/widget/ConstraintTypePicker.js}
 * @extends Core/widget/Combo
 * @classType constrainttypepicker
 */
export default class ConstraintTypePicker extends Combo {

    //region Config

    static get $name() {
        return 'ConstraintTypePicker';
    }

    // Factoryable type name
    static get type() {
        return 'constrainttypepicker';
    }

    static get configurable() {
        return {
            valueField : 'id'
        };
    }
    //endregion

    //region Localization

    updateLocalization() {
        super.updateLocalization();
        // rebuild newly translated options
        this.store.data = this.buildStoreData();
    }

    //endregion

    //region Internal

    buildStoreData() {
        const me = this;

        /* eslint-disable quote-props */
        return [
            {
                'id' : 'none',
                text : me.L('L{none}')
            },
            {
                'id' : 'muststarton',
                text : me.L('L{muststarton}')
            },
            {
                'id' : 'mustfinishon',
                text : me.L('L{mustfinishon}')
            },
            {
                'id' : 'startnoearlierthan',
                text : me.L('L{startnoearlierthan}')
            },
            {
                'id' : 'startnolaterthan',
                text : me.L('L{startnolaterthan}')
            },
            {
                'id' : 'finishnoearlierthan',
                text : me.L('L{finishnoearlierthan}')
            },
            {
                'id' : 'finishnolaterthan',
                text : me.L('L{finishnolaterthan}')
            }
        ];
        /* eslint-enable quote-props */
    }

    set value(value) {
        super.value = value;
    }

    get value() {
        const value = super.value;

        return value === 'none' ? null : value;
    }

    get store() {
        if (!this._store) {
            this.store = new Store({
                data        : this.buildStoreData(),
                allowNullId : true
            });
        }

        return this._store;
    }

    set store(store) {
        super.store = store;
    }

    //endregion

}

// Register this widget type with its Factory
ConstraintTypePicker.initClass();
