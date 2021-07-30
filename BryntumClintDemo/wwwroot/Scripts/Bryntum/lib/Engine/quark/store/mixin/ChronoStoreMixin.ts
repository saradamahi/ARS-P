import { AnyConstructor, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js"
import Store from "../../../../Core/data/Store.js"


export class ChronoStoreMixin extends Mixin(
    [ Store ],
    (base : AnyConstructor<Store>) =>

class ChronoStoreMixin extends base {

    /**
     * The store class to instantiate when a raw config object is supplied to a Project
     */
    storeClass : AnyConstructor<this, typeof ChronoStoreMixin>
}) {}
