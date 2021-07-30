var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Effect } from "../../ChronoGraph/chrono/Effect.js";
import { Base } from "../../ChronoGraph/class/BetterMixin.js";
import { prototypeValue } from "../../ChronoGraph/util/Helpers.js";
export const ConflictSymbol = Symbol('ConflictSymbol');
export var ConflictResolutionResult;
(function (ConflictResolutionResult) {
    ConflictResolutionResult["Cancel"] = "Cancel";
    ConflictResolutionResult["Resume"] = "Resume";
})(ConflictResolutionResult || (ConflictResolutionResult = {}));
export class ConflictEffect extends Effect {
    constructor() {
        super(...arguments);
        this.handler = ConflictSymbol;
    }
}
__decorate([
    prototypeValue(false)
], ConflictEffect.prototype, "sync", void 0);
export class ConflictResolution extends Base {
    getDescription() {
        throw new Error('Abstract method');
    }
    resolve() {
        throw new Error('Abstract method');
    }
}
