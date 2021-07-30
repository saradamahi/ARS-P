import { AnyConstructor, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js"
import { CalculationIterator } from "../../../../ChronoGraph/primitives/Calculation.js"
import { reference } from "../../../../ChronoGraph/replica/Reference.js"
import { bucket } from "../../../../ChronoGraph/replica/ReferenceBucket.js"
import { HasSubEventsMixin } from "./HasSubEventsMixin.js"

/**
 * Specialized version of the [[HasSubEventsMixin]]. The event becomes part of the tree structure.
 * It now has reference to the [[parentEvent]] and a collection of [[childEvents]].
 *
 * The abstract methods from the [[HasSubEventsMixin]] are defined to operate on the [[childEvents]] collection.
 */
export class HasChildrenMixin extends Mixin(
    [ HasSubEventsMixin ],
    (base : AnyConstructor<HasSubEventsMixin, typeof HasSubEventsMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class HasChildrenMixin extends base {

        /**
         * A reference to the parent event
         */
        @reference({ bucket : 'childEvents' })
        parentEvent     : HasChildrenMixin

        /**
         * A set of references to child events
         */
        @bucket()
        childEvents     : Set<HasChildrenMixin>

        // our override for the `parent` property, which is needed to update the `parentEvent` property
        private _parent : this


        * hasSubEvents () : CalculationIterator<boolean> {
            const childEvents   = yield this.$.childEvents

            return childEvents.size > 0
        }


        * subEventsIterable () : CalculationIterator<Iterable<HasChildrenMixin>> {
            return yield this.$.childEvents
        }


        get parent () : this {
            return this._parent
        }


        set parent (value : this) {
            this._parent = value

            this.parentEvent = value
        }
    }

    return HasChildrenMixin
}){}
