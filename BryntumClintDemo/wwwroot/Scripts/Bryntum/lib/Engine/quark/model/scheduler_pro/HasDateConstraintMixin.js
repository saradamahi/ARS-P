var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ProposedOrPrevious, ProposedOrPreviousValueOf } from '../../../../ChronoGraph/chrono/Effect.js';
import { Mixin } from '../../../../ChronoGraph/class/BetterMixin.js';
import { calculate } from '../../../../ChronoGraph/replica/Entity.js';
import { dateConverter, model_field } from '../../../chrono/ModelFieldAtom.js';
import { DateInterval } from '../../../scheduling/DateInterval.js';
import { ConstraintType, Direction } from '../../../scheduling/Types.js';
import { HasChildrenMixin } from '../scheduler_basic/HasChildrenMixin.js';
import { ConstrainedEarlyEventMixin } from './ConstrainedEarlyEventMixin.js';
export class HasDateConstraintMixin extends Mixin([ConstrainedEarlyEventMixin, HasChildrenMixin], (base) => {
    const superProto = base.prototype;
    class HasDateConstraint extends base {
        writeStartDate(me, transaction, quark, date, keepDuration = true) {
            const project = this.getProject();
            if (transaction.graph.hasIdentifier(this.$.direction) && !(project && project.getStm().isRestoring)) {
                const constrainType = this.getStartDatePinConstraintType();
                if (constrainType) {
                    this.constraintType = constrainType;
                    this.constraintDate = date;
                }
            }
            return superProto.writeStartDate.call(this, me, transaction, quark, date, keepDuration);
        }
        writeEndDate(me, transaction, quark, date, keepDuration = false) {
            const project = this.getProject();
            if (transaction.graph.hasIdentifier(this.$.direction) && keepDuration && !(project && project.getStm().isRestoring)) {
                const constrainType = this.getEndDatePinConstraintType();
                if (constrainType) {
                    this.constraintType = constrainType;
                    this.constraintDate = date;
                }
            }
            return superProto.writeEndDate.call(this, me, transaction, quark, date, keepDuration);
        }
        *calculateConstraintType() {
            let constraintType = yield ProposedOrPrevious;
            if (!(yield* this.isConstraintTypeApplicable(constraintType))) {
                constraintType = null;
            }
            return constraintType;
        }
        *calculateConstraintDate(Y) {
            let constraintDate = yield ProposedOrPrevious;
            const constraintType = yield this.$.constraintType;
            if (!constraintType) {
                constraintDate = null;
            }
            else if (!constraintDate) {
                constraintDate = this.getConstraintTypeDefaultDate(Y, constraintType);
            }
            return constraintDate;
        }
        getStartDatePinConstraintType() {
            const { direction } = this;
            if (!this.isTaskPinnableWithConstraint())
                return null;
            switch (direction) {
                case Direction.Forward: return ConstraintType.StartNoEarlierThan;
                case Direction.Backward: return ConstraintType.FinishNoLaterThan;
            }
        }
        getEndDatePinConstraintType() {
            const { direction } = this;
            if (!this.isTaskPinnableWithConstraint())
                return null;
            switch (direction) {
                case Direction.Forward: return ConstraintType.FinishNoEarlierThan;
                case Direction.Backward: return ConstraintType.FinishNoLaterThan;
            }
        }
        isTaskPinnableWithConstraint() {
            const { manuallyScheduled, constraintType } = this;
            let result = false;
            if (!manuallyScheduled) {
                if (constraintType) {
                    switch (constraintType) {
                        case ConstraintType.StartNoEarlierThan:
                        case ConstraintType.StartNoLaterThan:
                        case ConstraintType.FinishNoEarlierThan:
                        case ConstraintType.FinishNoLaterThan:
                            result = true;
                    }
                }
                else {
                    result = true;
                }
            }
            return result;
        }
        getConstraintTypeDefaultDate(Y, constraintType) {
            switch (constraintType) {
                case ConstraintType.StartNoEarlierThan:
                case ConstraintType.StartNoLaterThan:
                case ConstraintType.MustStartOn:
                    return Y(ProposedOrPreviousValueOf(this.$.startDate));
                case ConstraintType.FinishNoEarlierThan:
                case ConstraintType.FinishNoLaterThan:
                case ConstraintType.MustFinishOn:
                    return Y(ProposedOrPreviousValueOf(this.$.endDate));
            }
            return null;
        }
        *isConstraintTypeApplicable(constraintType) {
            const childEvents = yield this.$.childEvents;
            const isSummary = childEvents.size > 0;
            switch (constraintType) {
                case ConstraintType.FinishNoEarlierThan:
                case ConstraintType.StartNoLaterThan:
                case ConstraintType.MustFinishOn:
                case ConstraintType.MustStartOn:
                    return !isSummary;
            }
            return true;
        }
        async setConstraint(constraintType, constraintDate) {
            this.constraintType = constraintType;
            if (constraintDate !== undefined) {
                this.constraintDate = constraintDate;
            }
            return this.commitAsync();
        }
        *calculateEndDateConstraintIntervals() {
            const intervals = yield* superProto.calculateEndDateConstraintIntervals.call(this);
            const constraintType = yield this.$.constraintType;
            const constraintDate = yield this.$.constraintDate;
            if (constraintType && constraintDate) {
                switch (constraintType) {
                    case ConstraintType.MustFinishOn:
                        intervals.unshift(DateInterval.new({
                            startDate: constraintDate,
                            endDate: constraintDate
                        }));
                        break;
                    case ConstraintType.FinishNoEarlierThan:
                        intervals.unshift(DateInterval.new({
                            startDate: constraintDate
                        }));
                        break;
                    case ConstraintType.FinishNoLaterThan:
                        intervals.unshift(DateInterval.new({
                            endDate: constraintDate
                        }));
                        break;
                }
            }
            return intervals;
        }
        *calculateStartDateConstraintIntervals() {
            const intervals = yield* superProto.calculateStartDateConstraintIntervals.call(this);
            const constraintType = yield this.$.constraintType;
            const constraintDate = yield this.$.constraintDate;
            if (constraintType && constraintDate) {
                switch (constraintType) {
                    case ConstraintType.MustStartOn:
                        intervals.unshift(DateInterval.new({
                            startDate: constraintDate,
                            endDate: constraintDate
                        }));
                        break;
                    case ConstraintType.StartNoEarlierThan:
                        intervals.unshift(DateInterval.new({
                            startDate: constraintDate
                        }));
                        break;
                    case ConstraintType.StartNoLaterThan:
                        intervals.unshift(DateInterval.new({
                            endDate: constraintDate
                        }));
                        break;
                }
            }
            return intervals;
        }
    }
    __decorate([
        model_field({ type: 'string' }, { sync: true })
    ], HasDateConstraint.prototype, "constraintType", void 0);
    __decorate([
        model_field({ type: 'date' }, { converter: dateConverter, sync: true })
    ], HasDateConstraint.prototype, "constraintDate", void 0);
    __decorate([
        calculate('constraintType')
    ], HasDateConstraint.prototype, "calculateConstraintType", null);
    __decorate([
        calculate('constraintDate')
    ], HasDateConstraint.prototype, "calculateConstraintDate", null);
    return HasDateConstraint;
}) {
}
