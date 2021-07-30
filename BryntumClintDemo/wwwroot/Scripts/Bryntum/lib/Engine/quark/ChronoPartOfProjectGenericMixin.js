import { Mixin } from "../../ChronoGraph/class/BetterMixin.js";
import { AbstractPartOfProjectGenericMixin } from "./AbstractPartOfProjectGenericMixin.js";
export class ChronoPartOfProjectGenericMixin extends Mixin([AbstractPartOfProjectGenericMixin], (base) => {
    const superProto = base.prototype;
    class ChronoPartOfProjectGenericMixin extends base {
        getGraph() {
            const project = this.getProject();
            return project === null || project === void 0 ? void 0 : project.getGraph();
        }
        getEventById(id) {
            var _a;
            return (_a = this.getEventStore()) === null || _a === void 0 ? void 0 : _a.getById(id);
        }
        getDependencyById(id) {
            var _a;
            return (_a = this.getDependencyStore()) === null || _a === void 0 ? void 0 : _a.getById(id);
        }
        getResourceById(id) {
            var _a;
            return (_a = this.getResourceStore()) === null || _a === void 0 ? void 0 : _a.getById(id);
        }
        getAssignmentById(id) {
            var _a;
            return (_a = this.getAssignmentStore()) === null || _a === void 0 ? void 0 : _a.getById(id);
        }
        getCalendarById(id) {
            var _a;
            return (_a = this.getCalendarManagerStore()) === null || _a === void 0 ? void 0 : _a.getById(id);
        }
    }
    return ChronoPartOfProjectGenericMixin;
}) {
}
