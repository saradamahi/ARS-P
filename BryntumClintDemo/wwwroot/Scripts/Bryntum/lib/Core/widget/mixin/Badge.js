import Base from '../../Base.js';

/**
 * @module Core/widget/mixin/Badge
 */

/**
 * Mixin that allows a widget to display a badge (mostly done as css)
 *
 * ```javascript
 * // show badge
 * button.badge = 5;
 *
 * // hide badge
 * button.badge = null;
 * ```
 *
 * @externalexample widget/Badge.js
 *
 * @mixin
 */
export default Target => class Badge extends (Target || Base) {
    static get $name() {
        return 'Badge';
    }

    static get configurable() {
        return {
            /**
             * Get/sets and display badge, set to null or empty string to hide.
             * @property {String}
             * @name badge
             */
            /**
             * Initial text to show in badge.
             * @config {String} badge
             */
            badge : null
        };
    };

    compose() {
        const { badge } = this;

        return {
            dataset : {
                badge
            },
            class : {
                'b-badge' : badge != null && badge !== ''
            }
        };
    }
};