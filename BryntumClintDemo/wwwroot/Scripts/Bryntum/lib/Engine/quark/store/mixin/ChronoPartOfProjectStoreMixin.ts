import { AnyConstructor, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js"
import { ChronoPartOfProjectGenericMixin } from "../../ChronoPartOfProjectGenericMixin.js"
import { ChronoStoreMixin } from "./ChronoStoreMixin.js"
import { AbstractPartOfProjectStoreMixin } from "./AbstractPartOfProjectStoreMixin.js"

/**
 * This a base mixin for every Store, that belongs to a ChronoGraph powered project.
 */
export class ChronoPartOfProjectStoreMixin extends Mixin(
    [
        AbstractPartOfProjectStoreMixin,
        ChronoPartOfProjectGenericMixin,
        ChronoStoreMixin
    ],
    (base : AnyConstructor<
        AbstractPartOfProjectStoreMixin &
        ChronoPartOfProjectGenericMixin &
        ChronoStoreMixin
        ,
        typeof AbstractPartOfProjectStoreMixin &
        typeof ChronoPartOfProjectGenericMixin &
        typeof ChronoStoreMixin
>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class ChronoPartOfProjectStoreMixin extends base {


        setStoreData (data : any) {
            // Inform project that a store is being repopulated, to avoid expensive unjoins
            this.project?.repopulateStore(this)

            superProto.setStoreData.call(this, data)
        }


    }

    return ChronoPartOfProjectStoreMixin

}){}

