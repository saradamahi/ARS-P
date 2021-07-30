var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ProposedArgumentsOf, ProposedOrPrevious, ProposedOrPreviousValueOf, Reject, Write } from "../../../../ChronoGraph/chrono/Effect.js";
import { Mixin } from "../../../../ChronoGraph/class/BetterMixin.js";
import { CalculateProposed } from "../../../../ChronoGraph/cycle_resolver/CycleResolver.js";
import { build_proposed, calculate, field, write } from "../../../../ChronoGraph/replica/Entity.js";
import DateHelper from "../../../../Core/helper/DateHelper.js";
import { dateConverter, model_field } from "../../../chrono/ModelFieldAtom.js";
import { Direction, TimeUnit } from "../../../scheduling/Types.js";
import { isNotNumber } from "../../../util/Functions.js";
import { durationFormula, DurationVar, endDateFormula, EndDateVar, Instruction, SEDBackwardCycleResolutionContext, SEDDispatcher, SEDDispatcherIdentifier, SEDForwardCycleResolutionContext, startDateFormula, StartDateVar } from "./BaseEventDispatcher.js";
import { HasCalendarMixin } from "./HasCalendarMixin.js";
export class BaseEventMixin extends Mixin([HasCalendarMixin], (base) => {
    const superProto = base.prototype;
    class BaseEventMixin extends base {
        *calculateDispatcher(YIELD) {
            const proposed = yield ProposedOrPrevious;
            const cycleDispatcher = yield* this.prepareDispatcher(YIELD);
            const startDateProposedArgs = yield ProposedArgumentsOf(this.$.startDate);
            const startInstruction = startDateProposedArgs ? (startDateProposedArgs[0] ? Instruction.KeepDuration : Instruction.KeepEndDate) : undefined;
            if (startInstruction)
                cycleDispatcher.addInstruction(startInstruction);
            const endDateProposedArgs = yield ProposedArgumentsOf(this.$.endDate);
            const endInstruction = endDateProposedArgs ? (endDateProposedArgs[0] ? Instruction.KeepDuration : Instruction.KeepStartDate) : undefined;
            if (endInstruction)
                cycleDispatcher.addInstruction(endInstruction);
            const directionValue = yield this.$.direction;
            const durationProposedArgs = yield ProposedArgumentsOf(this.$.duration);
            let durationInstruction;
            if (durationProposedArgs) {
                switch (durationProposedArgs[0]) {
                    case true:
                        durationInstruction = Instruction.KeepStartDate;
                        break;
                    case false:
                        durationInstruction = Instruction.KeepEndDate;
                        break;
                }
            }
            if (!durationInstruction && cycleDispatcher.hasProposedValue(DurationVar)) {
                durationInstruction = directionValue === Direction.Forward || directionValue === Direction.None ? Instruction.KeepStartDate : Instruction.KeepEndDate;
            }
            if (durationInstruction)
                cycleDispatcher.addInstruction(durationInstruction);
            return cycleDispatcher;
        }
        *prepareDispatcher(Y) {
            const dispatcherClass = this.dispatcherClass(Y);
            const cycleDispatcher = dispatcherClass.new({
                context: this.cycleResolutionContext(Y)
            });
            cycleDispatcher.collectInfo(Y, this.$.startDate, StartDateVar);
            cycleDispatcher.collectInfo(Y, this.$.endDate, EndDateVar);
            cycleDispatcher.collectInfo(Y, this.$.duration, DurationVar);
            return cycleDispatcher;
        }
        cycleResolutionContext(Y) {
            const direction = Y(this.$.direction);
            return direction === Direction.Forward || direction === Direction.None ? SEDForwardCycleResolutionContext : SEDBackwardCycleResolutionContext;
        }
        dispatcherClass(Y) {
            return SEDDispatcher;
        }
        buildProposedDispatcher(me, quark, transaction) {
            const dispatcher = this.dispatcherClass(transaction.onEffectSync).new({
                context: this.cycleResolutionContext(transaction.onEffectSync)
            });
            dispatcher.addPreviousValueFlag(StartDateVar);
            dispatcher.addPreviousValueFlag(EndDateVar);
            dispatcher.addPreviousValueFlag(DurationVar);
            return dispatcher;
        }
        *skipNonWorkingTime(date, isForward) {
            const calendar = yield this.$.effectiveCalendar;
            if (!date)
                return null;
            const skippingRes = calendar.skipNonWorkingTime(date, isForward);
            if (skippingRes instanceof Date) {
                return skippingRes;
            }
            else {
                yield Reject("Empty calendar");
            }
        }
        *skipWorkingTime(date, isForward, duration, unit) {
            const durationUnit = yield this.$.durationUnit;
            if (unit && unit !== durationUnit) {
                duration = yield* this.getProject().$convertDuration(duration, unit, durationUnit);
            }
            return yield* this.calculateProjectedXDateWithDuration(date, isForward, duration);
        }
        setStartDate(date, keepDuration = true) {
            if (this.graph) {
                this.graph.write(this.$.startDate, date, keepDuration);
                return this.graph.commitAsync();
            }
            else {
                this.$.startDate.DATA = date;
            }
        }
        writeStartDate(me, transaction, quark, date, keepDuration = true) {
            if (!transaction.baseRevision.hasIdentifier(me) && date == null)
                return;
            const instruction = keepDuration ? Instruction.KeepDuration : Instruction.KeepEndDate;
            me.constructor.prototype.write.call(this, me, transaction, quark, date, keepDuration);
        }
        *calculateStartDate() {
            const dispatch = yield this.$.dispatcher;
            const formulaId = dispatch.resolution.get(StartDateVar);
            if (formulaId === CalculateProposed) {
                return yield* this.calculateStartDateProposed();
            }
            else if (formulaId === startDateFormula.formulaId) {
                return yield* this.calculateStartDatePure();
            }
            else {
                throw new Error("Unknown formula for `startDate`");
            }
        }
        *calculateStartDatePure() {
            return yield* this.calculateProjectedXDateWithDuration(yield this.$.endDate, false, yield this.$.duration);
        }
        *calculateStartDateProposed() {
            const startDate = yield ProposedOrPrevious;
            return yield* this.skipNonWorkingTime(startDate, true);
        }
        *calculateProjectedXDateWithDuration(baseDate, isForward, duration) {
            const durationUnit = yield this.$.durationUnit;
            const calendar = yield this.$.effectiveCalendar;
            const project = this.getProject();
            if (!baseDate || isNotNumber(duration))
                return null;
            isForward = isForward === undefined ? true : isForward;
            if (isForward) {
                return calendar.calculateEndDate(baseDate, yield* project.$convertDuration(duration, durationUnit, TimeUnit.Millisecond));
            }
            else {
                return calendar.calculateStartDate(baseDate, yield* project.$convertDuration(duration, durationUnit, TimeUnit.Millisecond));
            }
        }
        setEndDate(date, keepDuration = false) {
            if (this.graph) {
                this.graph.write(this.$.endDate, date, keepDuration);
                return this.graph.commitAsync();
            }
            else {
                this.$.endDate.DATA = date;
            }
        }
        writeEndDate(me, transaction, quark, date, keepDuration = false) {
            if (!transaction.baseRevision.hasIdentifier(me) && date == null)
                return;
            me.constructor.prototype.write.call(this, me, transaction, quark, date, keepDuration);
        }
        *calculateEndDate() {
            const dispatch = yield this.$.dispatcher;
            const formulaId = dispatch.resolution.get(EndDateVar);
            if (formulaId === CalculateProposed) {
                return yield* this.calculateEndDateProposed();
            }
            else if (formulaId === endDateFormula.formulaId) {
                return yield* this.calculateEndDatePure();
            }
            else {
                throw new Error("Unknown formula for `endDate`");
            }
        }
        *calculateEndDatePure() {
            return yield* this.calculateProjectedXDateWithDuration(yield this.$.startDate, true, yield this.$.duration);
        }
        *calculateEndDateProposed() {
            const endDate = yield ProposedOrPrevious;
            return yield* this.skipNonWorkingTime(endDate, false);
        }
        getDuration(unit) {
            const duration = this.duration;
            return unit !== undefined ? this.getProject().convertDuration(duration, this.durationUnit, unit) : duration;
        }
        setDuration(duration, unit, keepStart) {
            if (this.graph) {
                if (duration !== undefined) {
                    this.graph.write(this.$.duration, duration, unit, keepStart);
                    return this.graph.commitAsync();
                }
            }
            else {
                this.$.duration.DATA = duration;
                if (unit != null)
                    this.$.durationUnit.DATA = unit;
            }
        }
        setDurationUnit(_value) {
            throw new Error("Use `setDuration` instead");
        }
        writeDuration(me, transaction, quark, duration, unit, keepStart = undefined) {
            if (duration < 0)
                duration = 0;
            if (!transaction.baseRevision.hasIdentifier(me) && duration == null)
                return;
            me.constructor.prototype.write.call(this, me, transaction, quark, duration, keepStart);
            if (unit != null)
                transaction.write(this.$.durationUnit, unit);
        }
        *calculateDuration() {
            const dispatch = yield this.$.dispatcher;
            const formulaId = dispatch.resolution.get(DurationVar);
            if (formulaId === CalculateProposed) {
                return yield* this.calculateDurationProposed();
            }
            else if (formulaId === durationFormula.formulaId) {
                return yield* this.calculateDurationPure();
            }
            else {
                throw new Error("Unknown formula for `duration`");
            }
        }
        *calculateDurationPure() {
            const startDate = yield this.$.startDate;
            const endDate = yield this.$.endDate;
            if (!startDate || !endDate)
                return null;
            if (startDate > endDate) {
                yield Write(this.$.duration, 0, null);
            }
            else {
                return yield* this.calculateProjectedDuration(startDate, endDate);
            }
        }
        *calculateDurationProposed() {
            return yield ProposedOrPrevious;
        }
        *calculateProjectedDuration(startDate, endDate, durationUnit) {
            if (!startDate || !endDate)
                return null;
            if (!durationUnit)
                durationUnit = yield this.$.durationUnit;
            const calendar = yield this.$.effectiveCalendar;
            const project = this.getProject();
            return yield* project.$convertDuration(calendar.calculateDurationMs(startDate, endDate), TimeUnit.Millisecond, durationUnit);
        }
        *calculateEffectiveDuration() {
            const dispatch = yield this.$.dispatcher;
            let effectiveDurationToUse;
            const durationResolution = dispatch.resolution.get(DurationVar);
            if (durationResolution === CalculateProposed) {
                effectiveDurationToUse = yield this.$.duration;
            }
            else if (durationResolution === durationFormula.formulaId) {
                effectiveDurationToUse = yield* this.calculateProjectedDuration(yield ProposedOrPreviousValueOf(this.$.startDate), yield ProposedOrPreviousValueOf(this.$.endDate));
            }
            return effectiveDurationToUse;
        }
    }
    __decorate([
        model_field({ type: 'date' }, { converter: dateConverter })
    ], BaseEventMixin.prototype, "startDate", void 0);
    __decorate([
        model_field({ type: 'date' }, { converter: dateConverter })
    ], BaseEventMixin.prototype, "endDate", void 0);
    __decorate([
        model_field({ type: 'number', allowNull: true })
    ], BaseEventMixin.prototype, "duration", void 0);
    __decorate([
        model_field({ type: 'string', defaultValue: TimeUnit.Day }, { converter: DateHelper.normalizeUnit })
    ], BaseEventMixin.prototype, "durationUnit", void 0);
    __decorate([
        model_field({ type: 'string', defaultValue: Direction.Forward }, { sync: true })
    ], BaseEventMixin.prototype, "direction", void 0);
    __decorate([
        field({ identifierCls: SEDDispatcherIdentifier })
    ], BaseEventMixin.prototype, "dispatcher", void 0);
    __decorate([
        model_field({ type: 'boolean', defaultValue: false })
    ], BaseEventMixin.prototype, "manuallyScheduled", void 0);
    __decorate([
        calculate('dispatcher')
    ], BaseEventMixin.prototype, "calculateDispatcher", null);
    __decorate([
        build_proposed('dispatcher')
    ], BaseEventMixin.prototype, "buildProposedDispatcher", null);
    __decorate([
        write('startDate')
    ], BaseEventMixin.prototype, "writeStartDate", null);
    __decorate([
        calculate('startDate')
    ], BaseEventMixin.prototype, "calculateStartDate", null);
    __decorate([
        write('endDate')
    ], BaseEventMixin.prototype, "writeEndDate", null);
    __decorate([
        calculate('endDate')
    ], BaseEventMixin.prototype, "calculateEndDate", null);
    __decorate([
        write('duration')
    ], BaseEventMixin.prototype, "writeDuration", null);
    __decorate([
        calculate('duration')
    ], BaseEventMixin.prototype, "calculateDuration", null);
    return BaseEventMixin;
}) {
}
