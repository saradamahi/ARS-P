import Base from '../Base.js';
import DomDataStore from '../data/DomDataStore.js';

/**
 * @module Core/mixin/Droppable
 */

/**
 * Mix this into another class to enable drop support and receive drops from {@link Core.mixin.Draggable draggables}.
 *
 * There are 4 basic methods that a droppable implements. These methods are called as drag operations occur:
 *
 * ```javascript
 *  class MyDroppable extends Base.mixin(Droppable) {
 *      dragEnter(drag) {
 *          // a drag has entered the drop zone... create some type of drop indicator perhaps
 *      }
 *
 *      dragMove(drag) {
 *          // a drag has changed position... update drop indicators
 *      }
 *
 *      dragDrop(drag) {
 *          // drop has occurred... process data from the drag context
 *      }
 *
 *      dragLeave(drag) {
 *          // the drag has left the drop zone... cleanup indicators
 *      }
 *  }
 * ```
 *
 * Instances of `Droppable` are associated with an element to receive drag operations:
 *
 * ```javascript
 *  let target = new MyDroppable({
 *      dropRootElement : someElement
 *  });
 * ```
 * @mixin
 * @internal
 */
export default Target => class Droppable extends (Target || Base) {
    static get $name() {
        return 'Droppable';
    }

    //region Configs

    static get configurable() {
        return {
            /**
             * The current `DragContext`. This is set when a drag enters this target. Changing this config causes the
             * {@link #function-dragEnter} and {@link #function-dragLeave} methods to be called. If `dragEnter` returns
             * `false` for a drag, this value will be set to `null`.
             * @member {Core.util.drag.DragContext}
             * @readonly
             */
            dropping : null,

            /**
             * Set this config to the element where drops should be received. When set, the `b-droppable` CSS class is
             * added to the element and the `Droppable` instance is associated with that element so that it can be
             * found by {@link Core.mixin.Draggable draggables}.
             * @config {HTMLElement}
             */
            dropRootElement : {
                $config : 'nullify',

                value : null
            }
        };
    }

    /**
     * Returns the CSS class that is added to the {@link #config-dropRootElement}, i.e., `'b-droppable'`.
     * @property {String}
     * @readonly
     */
    get droppableCls() {
        return 'b-droppable';
    }

    //endregion
    //region Drop Management

    /**
     * This method is called when a drag enters this droppable's `dropRootElement`. In many cases, this method is used
     * to create some sort of drop indicator to provide user feedback.
     *
     * If this method does not return `false`, the {@link #property-dropping} config will retain the given `drag` context
     * which was set prior to this method being called.
     *
     * If this method returns `false`, the drop will not be accepted. Neither {@link #function-dragDrop} nor
     * {@link #function-dragLeave} will be called for this drop. If the drag leaves this target and re-enters, this
     * method will be called again. While `dropping` will already be updated before this method is called, it will be
     * reset to `null` in this case.
     *
     * @param {Core.util.drag.DragContext} drag
     * @returns {Boolean}
     */
    dragEnter(drag) {
        // template
    }

    /**
     * This method is called when the drag that was previously announced via {@link #function-dragEnter} moves to a new
     * position. This is typically where drop indicators are updated to reflect the new position.
     * @param {Core.util.drag.DragContext} drag
     */
    dragMove(drag) {
        // template
    }

    /**
     * This method is called when the drag that was previously announced via {@link #function-dragEnter} has ended with
     * a drop. In addition to any cleanup (since {@link #function-dragLeave} will not be called), this method handles
     * any updates associated with the data from the drag context and the position of the drop.
     * @param {Core.util.drag.DragContext} drag
     */
    dragDrop(drag) {
        // template
    }

    /**
     * This method is called when the drag that was previously announced via {@link #function-dragEnter} leaves this
     * droppable's `dropRootElement`. This is the time to cleanup anything created by `dragEnter`.
     * @param {Core.util.drag.DragContext} drag
     */
    dragLeave(drag) {
        // template
    }

    //endregion
    //region Configs

    changeDropping(dropping, was) {
        if (dropping !== was) {
            const me = this;

            if (was) {
                if (was.aborted || !was.completed) {
                    me.dragLeave(was);
                }
            }

            if (dropping) {
                me._dropping = dropping;  // update config value early in case dragEnter et al refer to it

                if (me.dragEnter(dropping) === false) {
                    dropping = null;
                }

                me._dropping = was;  // restore the value so that updateDropping is called as it should be
            }
        }

        return dropping;
    }

    updateDropRootElement(rootEl, was) {
        const { droppableCls } = this;

        if (was) {
            was.classList.remove(droppableCls);

            if (DomDataStore.get(was, 'droppable') === this) {
                DomDataStore.remove(was, 'droppable');
            }
        }

        if (rootEl) {
            rootEl.classList.add(droppableCls);
            DomDataStore.set(rootEl, 'droppable', this);
        }
    }

    //endregion
};
