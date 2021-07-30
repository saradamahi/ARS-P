import { Mixin } from "../../../../ChronoGraph/class/BetterMixin.js";
import { CorePartOfProjectModelMixin } from "../mixin/CorePartOfProjectModelMixin.js";
import DateHelper from "../../../../Core/helper/DateHelper.js";
export class CoreEventMixin extends Mixin([CorePartOfProjectModelMixin], (base) => {
    const superProto = base.prototype;
    class CoreEventMixin extends base {
        constructor() {
            super(...arguments);
            this._startDate = null;
            this._endDate = null;
            this._duration = null;
        }
        static get fields() {
            return [
                { name: 'startDate', type: 'date' },
                { name: 'endDate', type: 'date' },
                { name: 'duration', type: 'number' },
                { name: 'durationUnit', type: 'string', defaultValue: 'day' }
            ];
        }
        get startDate() { var _a, _b; return (_b = (_a = this._startDate) !== null && _a !== void 0 ? _a : this.get('startDate')) !== null && _b !== void 0 ? _b : null; }
        get endDate() { var _a, _b; return (_b = (_a = this._endDate) !== null && _a !== void 0 ? _a : this.get('endDate')) !== null && _b !== void 0 ? _b : null; }
        get duration() { var _a, _b; return (_b = (_a = this._duration) !== null && _a !== void 0 ? _a : this.get('duration')) !== null && _b !== void 0 ? _b : null; }
        set startDate(value) { this.proposeStartDate(value); }
        set endDate(value) { this.proposeEndDate(value); }
        set duration(value) { this.proposeDuration(value); }
        getStartDate() {
            return this.startDate;
        }
        proposeStartDate(startDate, keepDuration = true) {
            this._startDate = startDate;
            this.propose({ startDate, keepDuration });
        }
        async setStartDate(startDate, keepDuration = true) {
            var _a;
            this.proposeStartDate(startDate, keepDuration);
            return (_a = this.project) === null || _a === void 0 ? void 0 : _a.commitAsync();
        }
        getEndDate() {
            return this.endDate;
        }
        proposeEndDate(endDate, keepDuration = false) {
            this._endDate = endDate;
            this.propose({ endDate, keepDuration });
        }
        async setEndDate(endDate, keepDuration = false) {
            var _a;
            this.proposeEndDate(endDate, keepDuration);
            return (_a = this.project) === null || _a === void 0 ? void 0 : _a.commitAsync();
        }
        getDuration() {
            return this.duration;
        }
        proposeDuration(duration, unit, keepStart = true) {
            this._duration = duration;
            this.propose({ duration, keepStart });
            if (unit)
                this.propose({ durationUnit: unit });
        }
        async setDuration(duration, unit, keepStart = true) {
            var _a;
            this.proposeDuration(duration, unit, keepStart);
            return (_a = this.project) === null || _a === void 0 ? void 0 : _a.commitAsync();
        }
        getDurationUnit() {
            return this.durationUnit;
        }
        joinProject() {
            var _a;
            const me = this;
            const changed = me.$changed;
            const startDate = me.getCurrentOrProposed('startDate');
            const endDate = me.getCurrentOrProposed('endDate');
            const duration = me.getCurrentOrProposed('duration');
            if (startDate != null)
                changed.startDate = me._startDate = startDate;
            if (endDate != null)
                changed.endDate = me._endDate = endDate;
            if (duration != null)
                changed.duration = me._duration = duration;
            if (me.eventStore && !me.eventStore.isLoadingData) {
                const unresolved = (_a = me.assignmentStore) === null || _a === void 0 ? void 0 : _a.storage.findItem('event', null);
                if (unresolved) {
                    for (const assignment of unresolved) {
                        if (assignment.getCurrentOrProposed('event') === me.id) {
                            assignment.setChanged('event', me);
                        }
                    }
                }
            }
            superProto.joinProject.call(me);
        }
        applyValue(useProp, key, value, skipAccessors, field) {
            if (key === 'startDate' || key == 'duration' || key === 'endDate') {
                useProp = true;
                this['_' + key] = value;
            }
            if (skipAccessors) {
                useProp = false;
            }
            superProto.applyValue.call(this, useProp, key, value, skipAccessors, field);
        }
        afterChange(toSet, wasSet, silent, fromRelationUpdate, skipAccessors) {
            if (!this.$isCalculating && !skipAccessors) {
                this.setData(this.$changed);
            }
            superProto.afterChange.call(this, toSet, wasSet, silent, fromRelationUpdate, skipAccessors);
        }
        calculateInvalidated() {
            const me = this;
            const changed = me.$changed;
            const changedStart = 'startDate' in changed;
            const changedEnd = 'endDate' in changed;
            const changedDuration = 'duration' in changed;
            const { startDate, endDate, duration, keepDuration, keepStart } = changed;
            let calculate = null;
            if (changedStart && !changedEnd && !changedDuration) {
                if (startDate === null) {
                    changed.endDate = null;
                }
                else if (me.hasCurrentOrProposed('endDate') && startDate > me.getCurrentOrProposed('endDate') && !keepDuration) {
                    changed.endDate = startDate;
                    changed.duration = 0;
                }
                else if (me.hasCurrentOrProposed('duration') && (keepDuration || !me.hasCurrentOrProposed('endDate'))) {
                    calculate = 'endDate';
                }
                else if (me.hasCurrentOrProposed('endDate')) {
                    calculate = 'duration';
                }
            }
            else if (!changedStart && changedEnd && !changedDuration) {
                if (endDate === null) {
                    changed.startDate = null;
                }
                else if (me.hasCurrentOrProposed('startDate') && endDate < me.getCurrentOrProposed('startDate') && !keepDuration) {
                    changed.startDate = endDate;
                    changed.duration = 0;
                }
                else if (me.hasCurrentOrProposed('duration') && (keepDuration || !me.hasCurrentOrProposed('startDate'))) {
                    calculate = 'startDate';
                }
                else if (me.hasCurrentOrProposed('startDate')) {
                    calculate = 'duration';
                }
            }
            else if (!changedStart && !changedEnd && changedDuration) {
                if (duration === null) {
                    changed.endDate = null;
                }
                else if (me.hasCurrentOrProposed('startDate') && (keepStart || !me.hasCurrentOrProposed('endDate'))) {
                    if (keepStart && changed.duration < 0) {
                        changed.duration = 0;
                    }
                    calculate = 'endDate';
                }
                else if (me.hasCurrentOrProposed('endDate')) {
                    calculate = 'startDate';
                }
            }
            else if (changedStart && changedEnd && !changedDuration) {
                if (startDate === null && endDate === null) {
                    changed.duration = null;
                }
                else {
                    calculate = 'duration';
                }
            }
            else if (changedStart && !changedEnd && changedDuration) {
                calculate = 'endDate';
            }
            else if (!changedStart && changedEnd && changedDuration) {
                calculate = 'startDate';
            }
            else if (changedStart && changedEnd && changedDuration) {
                if (duration == null) {
                    calculate = 'duration';
                }
                else if (startDate == null) {
                    calculate = 'startDate';
                }
                else {
                    calculate = 'endDate';
                }
            }
            switch (calculate) {
                case 'startDate':
                    changed.startDate = DateHelper.add(me.getCurrentOrProposed('endDate'), -me.getCurrentOrProposed('duration'), me.getCurrentOrProposed('durationUnit'));
                    break;
                case 'endDate':
                    changed.endDate = DateHelper.add(me.getCurrentOrProposed('startDate'), me.getCurrentOrProposed('duration'), me.getCurrentOrProposed('durationUnit'));
                    break;
                case 'duration':
                    changed.duration = DateHelper.diff(me.getCurrentOrProposed('startDate'), me.getCurrentOrProposed('endDate'), me.getCurrentOrProposed('durationUnit'));
                    break;
            }
            if (changed.startDate !== undefined)
                this._startDate = changed.startDate;
            if (changed.endDate !== undefined)
                this._endDate = changed.endDate;
            if (changed.duration !== undefined)
                this._duration = changed.duration;
            delete changed.keepDuration;
            delete changed.keepStart;
        }
    }
    return CoreEventMixin;
}) {
}
