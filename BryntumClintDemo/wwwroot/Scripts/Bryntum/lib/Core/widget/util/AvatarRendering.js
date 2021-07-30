import Base from '../../Base.js';
import DomHelper from '../../helper/DomHelper.js';
import EventHelper from '../../helper/EventHelper.js';
import StringHelper from '../../helper/StringHelper.js';

/**
 * @module Core/widget/util/AvatarRendering
 */

/**
 * Internal utility class providing rendering of avatars / resource initials.
 *
 * @internal
 * @extends Core/Base
 */
export default class AvatarRendering extends Base {
    static get $name() {
        return 'AvatarRendering';
    }

    static get configurable() {
        return {
            /**
             * Element used to listen for load errors on. Normally a owning widgets own element.
             * @config {HTMLElement}
             */
            element : null,

            /**
             * Prefix prepended to a supplied color to create a CSS class applied when showing initials.
             * @config {String}
             * @default
             */
            colorPrefix : 'b-sch-'
        };
    }

    updateElement(element) {
        // Error listener
        EventHelper.on({
            element,
            delegate : '.b-resource-image',
            error    : 'onImageErrorEvent',
            thisObj  : this,
            capture  : true
        });
    }

    get failedUrls() {
        if (!this._failedUrls) {
            this._failedUrls = new Set();
        }
        return this._failedUrls;
    }

    /**
     * Returns a DOM config object containing a resource avatar, icon or resource initials. Display priority in that
     * order.
     * @param {Object} options Avatar options
     * @param {String} options.initials Resource initials
     * @param {String} options.color Background color for initials
     * @param {String} options.iconCls Icon cls
     * @param {String} options.imageUrl Image url
     * @param {String} options.defaultImageUrl Default image url, fallback if image fails to load or there is none
     * specified. Leave out to show initials instead.
     * @returns {Object}
     * @internal
     */
    getResourceAvatar({ initials, color, iconCls, imageUrl, defaultImageUrl }) {
        return this.getImageConfig(initials, color, imageUrl, defaultImageUrl) ||
            this.getIconConfig(iconCls) ||
            this.getResourceInitialsConfig(initials, color);
    }

    getImageConfig(initials, color, imageUrl, defaultImageUrl) {
        // Fall back to defaultImageUrl if imageUrl is known to fail
        imageUrl = this.failedUrls.has(imageUrl) ? defaultImageUrl : (imageUrl  || defaultImageUrl);

        if (imageUrl) {
            return {
                tag         : 'img',
                draggable   : 'false',
                class       : 'b-resource-avatar b-resource-image',
                elementData : {
                    defaultImageUrl,
                    imageUrl,
                    initials,
                    color
                },
                src : imageUrl
            };
        }
    }

    getIconConfig(iconCls) {
        if (iconCls) {
            return iconCls && {
                tag       : 'i',
                className : `b-resource-avatar b-resource-icon ${iconCls}`
            };
        }
    }

    getResourceInitialsConfig(initials, color) {
        const
            // eventColor = #FF5555, apply as background-color
            namedColor = DomHelper.isNamedColor(color) && color,
            // eventColor = red, add b-sch-red cls
            hexColor   = !namedColor && color;

        return {
            tag       : 'div',
            className : {
                'b-resource-avatar'                  : 1,
                'b-resource-initials'                : 1,
                [`${this.colorPrefix}${namedColor}`] : namedColor
            },
            style : {
                backgroundColor : hexColor || null
            },
            html : StringHelper.encodeHtml(initials)
        };
    }

    onImageErrorEvent({ target }) {
        if (!target.matches('.b-resource-avatar')) {
            return;
        }

        const { defaultImageUrl, initials, color, imageUrl } = target.elementData;

        if (defaultImageUrl && !target.src.endsWith(defaultImageUrl.replace(/^[./]*/gm, ''))) {
            target.src = defaultImageUrl;
        }
        else {
            const initialsEl = DomHelper.createElement(this.getResourceInitialsConfig(initials, color));
            target.parentElement.replaceChild(initialsEl, target);
        }

        // Remember failed urls, to avoid trying to load them again next time
        this.failedUrls.add(imageUrl);
    }
}
