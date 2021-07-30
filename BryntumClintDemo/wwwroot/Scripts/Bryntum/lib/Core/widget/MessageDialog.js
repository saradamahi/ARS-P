import Popup from './Popup.js';
import './Button.js';
import './TextField.js';

/**
 * @module Core/widget/MessageDialog
 */

class MessageDialogConstructor extends Popup {

    static get $name() {
        return 'MessageDialog';
    }

    // Factoryable type name
    static get type() {
        return 'messagedialog';
    }

    static get configurable() {
        return {
            id : 'bryntum-msgdialog',

            centered    : true,
            modal       : true,
            hidden      : true,
            autoShow    : false,
            closeAction : 'hide',
            title       : '\xa0',

            lazyItems : {
                $config : ['lazy'],
                value   : [{
                    type : 'widget',
                    id   : 'bryntum-msgdialog-message',
                    cls  : 'b-msgdialog-message',
                    ref  : 'message'
                }, {
                    type : 'textfield',
                    id   : 'bryntum-msgdialog-input',
                    cls  : 'b-msgdialog-input',
                    ref  : 'input'
                }]
            },

            bbar : {
                id    : 'bryntum-msgdialog-bbar',
                items : [{
                    ref     : 'yesButton',
                    id      : 'bryntum-msgdialog-yesbutton',
                    cls     : 'b-msgdialog-yesbutton b-green',
                    text    : 'L{Object.Yes}',
                    onClick : 'up.onYesClick'
                }, {
                    ref     : 'noButton',
                    id      : 'bryntum-msgdialog-nobutton',
                    cls     : 'b-msgdialog-nobutton b-gray',
                    text    : 'L{Object.No}',
                    onClick : 'up.onNoClick'
                }, {
                    ref     : 'cancelButton',
                    id      : 'bryntum-msgdialog-cancelbutton',
                    cls     : 'b-msgdialog-cancelbutton b-gray',
                    text    : 'L{Object.Cancel}',
                    onClick : 'up.onCancelClick'
                }]
            }
        };
    }

    construct() {
        /**
         * The enum value for the no button
         * @property {Number} noButton
         * @type {Number}
         * @readOnly
         */
        this.noButton = 0;

        /**
         * The enum value for the yes button
         * @property {Number} yesButton
         * @type {Number}
         * @readOnly
         */
        this.yesButton = 1;

        /**
         * The enum value for the cancel button
         * @property {Number} cancelButton
         * @type {Number}
         * @readOnly
         */
        this.cancelButton = 3;

        super.construct(...arguments);
    }

    /**
     * Shows a confirm dialog with "Yes" and "No" buttons. The returned promise resolves passing `true`
     * if the "yes" button is pressed, and `false` if the "No" button is pressed. Typing `ESC` rejects.
     * @async
     * @param {Object} options An options object for what to show.
     * @param {String} [options.title] The title to show in the dialog header.
     * @param {String} [options.message] The message to show in the dialog body.
     * @param {String} [options.rootElement] The root element of this widget, defaults to document.body. Use this
     * if you use the MessageDialog inside a web component ShadowRoot
     * @returns {Promise} A promise which is resolved when the dialog is shown
     */
    async confirm({
        message,
        title = '\xa0',
        rootElement = document.body
    }) {
        const me = this;

        me.rootElement = rootElement;

        // Ensure our child items are instanced
        me.getConfig('lazyItems');

        me.title = me.optionalL(title);
        me.element.classList.remove(me.showClass);

        if (message) {
            me.showClass = 'b-show-message-yes-no';
            me.widgetMap.message.html = me.optionalL(message);
        }
        else {
            me.showClass = 'b-show-yes-no';
        }
        me.element.classList.add(me.showClass);

        me.show();

        return me.promise = new Promise((resolve) => {
            me.resolve = resolve;
        });
    }

    doResolve(value) {
        const
            me          = this,
            { resolve } = me;

        if (resolve) {
            me.resolve = me.reject = me.promise = null;
            resolve(value);
            me.hide();
        }
    }

    onInternalKeyDown(event) {
        // Cancel on escape key
        if (event.key === 'Escape') {
            event.stopImmediatePropagation();
            if (this.widgetMap.cancelButton.isVisible) {
                this.onCancelClick();
            }
            else {
                this.onNoClick();
            }
        }
        super.onInternalKeyDown(event);
    }

    onYesClick() {
        this.doResolve(MessageDialog.yesButton);
    }

    onNoClick() {
        this.doResolve(MessageDialog.noButton);
    }

    onCancelClick() {
        this.doResolve(MessageDialog.cancelButton);
    }
}

// Register this widget type with its Factory
MessageDialogConstructor.initClass();

const MessageDialog = new MessageDialogConstructor();

/**
 * A singleton modal dialog box which can be used to ask the user to confirm or reject actions.
 *
 * @class
 * @singleton
 * @externalexample widget/MessageDialog.js
 * @extends Core/widget/Popup
 */
export default MessageDialog;
