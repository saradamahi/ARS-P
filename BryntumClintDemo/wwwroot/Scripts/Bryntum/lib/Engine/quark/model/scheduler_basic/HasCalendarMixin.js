var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Mixin } from "../../../../ChronoGraph/class/BetterMixin.js";
import { calculate, field, generic_field, write } from "../../../../ChronoGraph/replica/Entity.js";
import { CalendarCacheMultiple } from "../../../calendar/CalendarCacheMultiple.js";
import { injectStaticFieldsProperty, isSerializableEqual, ModelReferenceField } from '../../../chrono/ModelFieldAtom.js';
import { stripDuplicates } from "../../../util/StripDuplicates.js";
import { ChronoPartOfProjectModelMixin } from "../mixin/ChronoPartOfProjectModelMixin.js";
import { BaseCalendarMixin } from "./BaseCalendarMixin.js";
export class HasCalendarMixin extends Mixin([ChronoPartOfProjectModelMixin], (base) => {
    const superProto = base.prototype;
    class HasCalendarMixin extends base {
        writeCalendar(me, transaction, quark, calendar) {
            const calendarManagerStore = this.getCalendarManagerStore();
            const cal = calendar;
            if (calendar && calendarManagerStore && calendar instanceof BaseCalendarMixin && !calendarManagerStore.includes(cal)) {
                calendarManagerStore.add(calendar);
            }
            me.constructor.prototype.write.call(this, me, transaction, quark, calendar);
        }
        resolveCalendar(locator) {
            var _a;
            return (_a = this.getCalendarManagerStore()) === null || _a === void 0 ? void 0 : _a.getById(locator);
        }
        *calculateEffectiveCalendar() {
            let calendar = yield this.$.calendar;
            if (!calendar) {
                const project = this.getProject();
                calendar = yield project.$.effectiveCalendar;
            }
            yield calendar.$.version;
            return calendar;
        }
    }
    __decorate([
        field()
    ], HasCalendarMixin.prototype, "effectiveCalendar", void 0);
    __decorate([
        generic_field({
            modelFieldConfig: {
                persist: true,
                serialize: calendar => calendar === null || calendar === void 0 ? void 0 : calendar.id,
                isEqual: isSerializableEqual
            },
            resolver: function (locator) {
                return this.resolveCalendar(locator);
            },
            sync: true
        }, ModelReferenceField)
    ], HasCalendarMixin.prototype, "calendar", void 0);
    __decorate([
        write('calendar')
    ], HasCalendarMixin.prototype, "writeCalendar", null);
    __decorate([
        calculate('effectiveCalendar')
    ], HasCalendarMixin.prototype, "calculateEffectiveCalendar", null);
    injectStaticFieldsProperty(HasCalendarMixin);
    return HasCalendarMixin;
}) {
}
export class CanCombineCalendarsMixin extends Mixin([], (base) => {
    const superProto = base.prototype;
    class CanCombineCalendars extends base {
        constructor() {
            super(...arguments);
            this.combinedcalendarscache = new Map();
        }
        combineCalendars(calendars) {
            const uniqueOnly = stripDuplicates(calendars);
            if (uniqueOnly.length === 0)
                throw new Error("No calendars to combine");
            uniqueOnly.sort((calendar1, calendar2) => {
                if (calendar1.internalId < calendar2.internalId)
                    return -1;
                else
                    return 1;
            });
            const hash = uniqueOnly.map(calendar => calendar.internalId + '/').join('');
            const versionsHash = uniqueOnly.map(calendar => calendar.version + '/').join('');
            const cached = this.combinedcalendarscache.get(hash);
            let res;
            if (cached && cached.versionsHash === versionsHash)
                res = cached.cache;
            else {
                res = new CalendarCacheMultiple({ calendarCaches: uniqueOnly.map(calendar => calendar.calendarCache) });
                this.combinedcalendarscache.set(hash, {
                    versionsHash: versionsHash,
                    cache: res
                });
            }
            return res;
        }
    }
    return CanCombineCalendars;
}) {
}
