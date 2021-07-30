import { Mixin } from "../../../../ChronoGraph/class/BetterMixin.js";
import { ChronoPartOfProjectGenericMixin } from "../../ChronoPartOfProjectGenericMixin.js";
import { ChronoStoreMixin } from "./ChronoStoreMixin.js";
import { AbstractPartOfProjectStoreMixin } from "./AbstractPartOfProjectStoreMixin.js";
export class ChronoPartOfProjectStoreMixin extends Mixin([
    AbstractPartOfProjectStoreMixin,
    ChronoPartOfProjectGenericMixin,
    ChronoStoreMixin
], (base) => {
    const superProto = base.prototype;
    class ChronoPartOfProjectStoreMixin extends base {
        setStoreData(data) {
            var _a;
            (_a = this.project) === null || _a === void 0 ? void 0 : _a.repopulateStore(this);
            superProto.setStoreData.call(this, data);
        }
    }
    return ChronoPartOfProjectStoreMixin;
}) {
}
