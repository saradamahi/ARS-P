import TextField from './TextField.js';

/**
 * @module Core/widget/DisplayField
 */

/**
 * DisplayField widget used to show a read only value
 *
 * @extends Core/widget/Field
 *
 * @example
 * let displayField = new DisplayField({
 *   label: 'name',
 *   value : 'John Doe'
 * });
 *
 * @classType DisplayField
 * @externalexample widget/DisplayField.js
 */
export default class DisplayField extends TextField {
    static get $name() {
        return 'DisplayField';
    }

    // Factoryable type name
    static get type() {
        return 'displayfield';
    }

    // Factoryable type alias
    static get alias() {
        return 'display';
    }

    static get configurable() {
        return {
            readOnly : true,
            editable : false,
            cls      : 'b-display-field'
        };
    }

    get focusElement() {
        // we're not focusable.
    }

    changeReadOnly() {
        return true;
    }

    changeEditable() {
        return false;
    }
}

// Register this widget type with its Factory
DisplayField.initClass();
