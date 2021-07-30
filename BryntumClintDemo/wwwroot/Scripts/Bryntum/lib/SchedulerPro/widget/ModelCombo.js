import Combo from '../../Core/widget/Combo.js';

/**
 * @module SchedulerPro/widget/ModelCombo
 */

/**
 * A special {@link Core.widget.Combo} subclass returning a {@link Core.data.Model} instance from its store as the value
 * @extends Core/widget/Combo
 * @classType modelcombo
 */
export default class ModelCombo extends Combo {

    //region Config

    static get $name() {
        return 'ModelCombo';
    }

    // Factoryable type name
    static get type() {
        return 'modelcombo';
    }

    //endregion

    //region Internal

    get value() {
        const
            superValue = super.value,
            model      = this.store.getById(superValue);

        return model || superValue;
    }

    set value(v) {
        super.value = v;
    }

    //endregion

}

// Register this widget type with its Factory
ModelCombo.initClass();
