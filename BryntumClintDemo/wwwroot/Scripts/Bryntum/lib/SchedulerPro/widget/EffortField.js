import DurationField from '../../Core/widget/DurationField.js';

/**
 * @module SchedulerPro/widget/EffortField
 */

// NOTE: class is created mostly for localization reasons
//       effort field invalidText might differ from duration field one.

/**
 * A specialized field allowing a user to also specify duration unit when editing the effort value.
 *
 * {@inlineexample schedulerpro/widget/EffortField.js}
 * @extends Core/widget/DurationField
 * @classType effort
 */
export default class EffortField extends DurationField {

    static get $name() {
        return 'EffortField';
    }

    // Factoryable type name
    static get type() {
        return 'effort';
    }

    // Factoryable type name
    static get alias() {
        return 'effortfield';
    }
}

// Register this widget type with its Factory
EffortField.initClass();
