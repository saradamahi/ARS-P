import { ProposedArgumentsOf, ProposedOrPrevious, ProposedOrPreviousValueOf, Reject, Write } from "../../../../ChronoGraph/chrono/Effect.js"
import { CommitResult } from "../../../../ChronoGraph/chrono/Graph.js"
import { Identifier } from "../../../../ChronoGraph/chrono/Identifier.js"
import { Quark } from "../../../../ChronoGraph/chrono/Quark.js"
import { SyncEffectHandler, Transaction } from "../../../../ChronoGraph/chrono/Transaction.js"
import { AnyConstructor, Mixin } from "../../../../ChronoGraph/class/BetterMixin.js"
import { CalculateProposed, CycleResolution, FormulaId } from "../../../../ChronoGraph/cycle_resolver/CycleResolver.js"
import { CalculationIterator } from "../../../../ChronoGraph/primitives/Calculation.js"
import { build_proposed, calculate, field, write } from "../../../../ChronoGraph/replica/Entity.js"
import DateHelper from "../../../../Core/helper/DateHelper.js"
import { dateConverter, model_field } from "../../../chrono/ModelFieldAtom.js"
import { DurationConverterMixin } from "../../../scheduling/DurationConverterMixin.js"
import { Direction, Duration, TimeUnit } from "../../../scheduling/Types.js"
import { isNotNumber } from "../../../util/Functions.js"
import { ChronoAbstractProjectMixin } from "./ChronoAbstractProjectMixin.js"
import { BaseCalendarMixin } from "./BaseCalendarMixin.js"
import {
    durationFormula,
    DurationVar,
    endDateFormula,
    EndDateVar,
    Instruction,
    SEDBackwardCycleResolutionContext,
    SEDDispatcher,
    SEDDispatcherIdentifier,
    SEDForwardCycleResolutionContext,
    startDateFormula,
    StartDateVar
} from "./BaseEventDispatcher.js"
import { HasCalendarMixin } from "./HasCalendarMixin.js"


//---------------------------------------------------------------------------------------------------------------------
/**
 * Base event entity mixin type.
 *
 * At this level event is only aware about its calendar (which is inherited from project, if not provided).
 * The functionality, related to the dependencies, constraints etc is provided in other mixins.
 *
 * A time interval will be "counted" into the event duration, only if the event's calendar has that interval
 * as working. Otherwise the time is skipped and not counted into event's duration.
 *
 */
export class BaseEventMixin extends Mixin(
    [ HasCalendarMixin ],
    (base : AnyConstructor<HasCalendarMixin, typeof HasCalendarMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class BaseEventMixin extends base {

        project                 : ChronoAbstractProjectMixin & DurationConverterMixin & HasCalendarMixin

        /**
         * The start date of the event. Can also be provided as a string, parsable with `DateHelper.parse()`
         */
        @model_field({ type : 'date' }, { converter : dateConverter })
        startDate       : Date

        /**
         * The end date of the event. Can also be provided as a string, parsable with `DateHelper.parse()`
         */
        @model_field({ type : 'date' }, { converter : dateConverter })
        endDate         : Date

        /**
         * The duration of the event. See also [[durationUnit]].
         */
        @model_field({ type : 'number', allowNull : true })
        duration        : Duration

        /**
         * The duration unit of the event's duration. See also [[duration]].
         */
        @model_field({ type : 'string', defaultValue : TimeUnit.Day }, { converter : DateHelper.normalizeUnit })
        durationUnit    : TimeUnit

        /**
         * The scheduling direction of the event. The `Forward` direction corresponds to the as-soon-as-possible scheduling (ASAP),
         * `Backward` - to as-late-as-possible (ALAP).
         */
        @model_field({ type : 'string', defaultValue : Direction.Forward }, { sync : true })
        direction       : Direction

        /**
         * The dispatcher instance for this event. Dispatcher accumulates the information about user input and decide which formula
         * to use for calculation of every related field (`startDate`, `endDate` and `duration` at this level).
         *
         * Every field can be calculated with 2 type of formulas. The 1st one is called "proposed" and it is used when
         * there is a user input for this field ("proposed" input), or, when user intention is to keep the previous value of the field.
         * The 2nd type is called "pure" and it is used, when a value of the field should be calculated "purely" based
         * on the values of other fields.
         *
         * See [[CycleResolverGuide]] for more information.
         */
        @field({ identifierCls : SEDDispatcherIdentifier })
        dispatcher      : SEDDispatcher

        /**
         * A boolean field, indicating whether this event should be scheduled automatically or
         * its [[startDate]] and [[endDate]] are supposed to be defined manually.
         */
        @model_field({ type : 'boolean', defaultValue : false })
        manuallyScheduled               : boolean

        getManuallyScheduled : () => boolean
        setManuallyScheduled : (mode : boolean) => Promise<CommitResult>
        putManuallyScheduled : (mode : boolean) => void




        @calculate('dispatcher')
        * calculateDispatcher (YIELD : SyncEffectHandler) : CalculationIterator<SEDDispatcher> {
            // this value is not used directly, but it contains a default cycle resolution
            // if we calculate different resolution, dispatcher will be marked dirty
            // on next revision
            const proposed                      = yield ProposedOrPrevious

            const cycleDispatcher               = yield* this.prepareDispatcher(YIELD)

            //--------------
            const startDateProposedArgs         = yield ProposedArgumentsOf(this.$.startDate)

            const startInstruction : Instruction = startDateProposedArgs ? (startDateProposedArgs[ 0 ] ? Instruction.KeepDuration : Instruction.KeepEndDate) : undefined

            if (startInstruction) cycleDispatcher.addInstruction(startInstruction)

            //--------------
            const endDateProposedArgs           = yield ProposedArgumentsOf(this.$.endDate)

            const endInstruction : Instruction    = endDateProposedArgs ? (endDateProposedArgs[ 0 ] ? Instruction.KeepDuration : Instruction.KeepStartDate) : undefined

            if (endInstruction) cycleDispatcher.addInstruction(endInstruction)

            //--------------
            const directionValue : Direction    = yield this.$.direction

            const durationProposedArgs          = yield ProposedArgumentsOf(this.$.duration)

            let durationInstruction : Instruction

            if (durationProposedArgs) {
                switch (durationProposedArgs[ 0 ]) {
                    case true:
                        durationInstruction     = Instruction.KeepStartDate
                        break

                    case false:
                        durationInstruction     = Instruction.KeepEndDate
                        break
                }
            }

            if (!durationInstruction && cycleDispatcher.hasProposedValue(DurationVar)) {
                durationInstruction = directionValue === Direction.Forward || directionValue === Direction.None ? Instruction.KeepStartDate : Instruction.KeepEndDate
            }

            if (durationInstruction) cycleDispatcher.addInstruction(durationInstruction)

            return cycleDispatcher
        }


        * prepareDispatcher (Y : SyncEffectHandler) : CalculationIterator<SEDDispatcher> {
            const dispatcherClass               = this.dispatcherClass(Y)

            const cycleDispatcher               = dispatcherClass.new({
                context                     : this.cycleResolutionContext(Y)
            })

            cycleDispatcher.collectInfo(Y, this.$.startDate, StartDateVar)
            cycleDispatcher.collectInfo(Y, this.$.endDate, EndDateVar)
            cycleDispatcher.collectInfo(Y, this.$.duration, DurationVar)

            return cycleDispatcher
        }


        cycleResolutionContext (Y) : CycleResolution {
            const direction : Direction         = Y(this.$.direction)

            return direction === Direction.Forward || direction === Direction.None ? SEDForwardCycleResolutionContext : SEDBackwardCycleResolutionContext
        }


        dispatcherClass (Y) : typeof SEDDispatcher {
            return SEDDispatcher
        }

        @build_proposed('dispatcher')
        buildProposedDispatcher (me : Identifier, quark : Quark, transaction : Transaction) : SEDDispatcher {
            const dispatcher = this.dispatcherClass(transaction.onEffectSync).new({
                context                     : this.cycleResolutionContext(transaction.onEffectSync)
            })

            dispatcher.addPreviousValueFlag(StartDateVar)
            dispatcher.addPreviousValueFlag(EndDateVar)
            dispatcher.addPreviousValueFlag(DurationVar)

            return dispatcher
        }


        /**
         * The method skips the event non working time starting from the provided `date` and
         * going either _forward_ or _backward_ in time.
         * It uses the event [[effectiveCalendar|effective calendar]] to detect which time is not working.
         * @param date Date to start skipping from
         * @param isForward Skip direction (`true` to go forward in time, `false` - backwards)
         */
        * skipNonWorkingTime (date : Date, isForward : boolean) : CalculationIterator<Date> {
            const calendar : BaseCalendarMixin  = yield this.$.effectiveCalendar

            if (!date) return null

            const skippingRes   = calendar.skipNonWorkingTime(date, isForward)

            if (skippingRes instanceof Date) {
                return skippingRes
            } else {
                yield Reject("Empty calendar")
            }
        }


        /**
         * The method skips the provided amount of the event _working time_
         * starting from the `date` and going either _forward_ or _backward_ in time.
         * It uses the event [[effectiveCalendar|effective calendar]] to detect which time is not working.
         * @param date Date to start skipping from
         * @param isForward Skip direction (`true` to go forward in time, `false` - backwards)
         * @param duration Amount of working time to skip
         * @param unit Units the `duration` value in (if not provided then duration is considered provided in [[durationUnit]])
         */
        * skipWorkingTime (date : Date, isForward : boolean, duration : Duration, unit? : TimeUnit) : CalculationIterator<Date> {

            const durationUnit : TimeUnit           = yield this.$.durationUnit

            // Convert duration to duration unit if needed
            if (unit && unit !== durationUnit) {
                duration    = yield* this.getProject().$convertDuration(duration, unit, durationUnit)
            }

            return yield* this.calculateProjectedXDateWithDuration(date, isForward, duration)
        }


        //region start date
        /**
         * Gets the event [[startDate|start date]]
         */
        getStartDate : () => Date

        // copied generated method, to avoid compilation error when it is overridden in HasDateConstraintMixin
        /**
         * Sets the event [[startDate|start date]]
         *
         * @param date The new start date to set
         * @param keepDuration Whether the intention is to keep the `duration` field (`keepDuration = true`) or `endDate` (`keepDuration = false`)
         */
        setStartDate (date : Date, keepDuration : boolean = true) : Promise<CommitResult> {
            if (this.graph) {
                this.graph.write(this.$.startDate, date, keepDuration)

                return this.graph.commitAsync()
            } else {
                this.$.startDate.DATA = date
            }
        }

        putStartDate : (date : Date, keepDuration? : boolean) => void


        @write('startDate')
        writeStartDate (me : Identifier, transaction : Transaction, quark : Quark, date : Date, keepDuration : boolean = true) {
            // we use the approach, that when user sets some atom to `null`
            // that `null` is propagated as a normal valid value through all calculation formulas
            // turning the result of all calculations to `null`
            // this works well, except the initial data load case, when don't want to do such propagation
            // but instead wants to "normalize" the data
            // because of that we ignore the `null` writes, for the initial data load case
            if (!transaction.baseRevision.hasIdentifier(me) && date == null) return

            const instruction : Instruction   = keepDuration ? Instruction.KeepDuration : Instruction.KeepEndDate

            me.constructor.prototype.write.call(this, me, transaction, quark, date, keepDuration)
        }


        /**
         * The main calculation method for the [[startDate]] field. Delegates to either [[calculateStartDateProposed]]
         * or [[calculateStartDatePure]], depending on the information from [[dispatcher]]
         */
        @calculate('startDate')
        * calculateStartDate () : CalculationIterator<Date> {
            const dispatch : SEDDispatcher = yield this.$.dispatcher

            const formulaId : FormulaId = dispatch.resolution.get(StartDateVar)

            if (formulaId === CalculateProposed) {
                return yield* this.calculateStartDateProposed()
            }
            else if (formulaId === startDateFormula.formulaId) {
                return yield* this.calculateStartDatePure()
            } else {
                throw new Error("Unknown formula for `startDate`")
            }
        }


        /**
         * The "pure" calculation function of the [[startDate]] field. It should calculate the [[startDate]] as if
         * there's no user input for it and no previous value - "purely" based on the values of other fields.
         *
         * At this level it delegates to [[calculateProjectedXDateWithDuration]]
         *
         * See also [[calculateStartDateProposed]].
         */
        * calculateStartDatePure () : CalculationIterator<Date> {
            return yield* this.calculateProjectedXDateWithDuration(yield this.$.endDate, false, yield this.$.duration)
        }


        /**
         * The "proposed" calculation function of the [[startDate]] field. It should calculate the [[startDate]] as if
         * there's a user input for it or a previous value. It can also use the values of other fields to "validate"
         * the "proposed" value.
         *
         * See also [[calculateStartDatePure]]
         */
        * calculateStartDateProposed () : CalculationIterator<Date> {
            const startDate : Date          = yield ProposedOrPrevious

            return yield* this.skipNonWorkingTime(startDate, true)
        }


        /**
         * This method calculates the opposite date of the event.
         *
         * @param baseDate The base date of the event (start or end date)
         * @param isForward Boolean flag, indicating whether the given `baseDate` is start date (`true`) or end date (`false`)
         * @param duration Duration of the event, in its [[durationUnit|durationUnits]]
         */
        * calculateProjectedXDateWithDuration (baseDate : Date, isForward : boolean, duration : Duration) : CalculationIterator<Date> {
            const durationUnit : TimeUnit               = yield this.$.durationUnit
            const calendar : BaseCalendarMixin          = yield this.$.effectiveCalendar
            const project : this[ 'project' ]           = this.getProject()

            if (!baseDate || isNotNumber(duration)) return null

            // calculate forward by default
            isForward = isForward === undefined ? true : isForward

            if (isForward) {
                return calendar.calculateEndDate(baseDate, yield* project.$convertDuration(duration, durationUnit, TimeUnit.Millisecond))
            } else {
                return calendar.calculateStartDate(baseDate, yield* project.$convertDuration(duration, durationUnit, TimeUnit.Millisecond))
            }
        }
        //endregion


        //region end date
        /**
         * Gets the event [[endDate|end date]].
         */
        getEndDate : () => Date

        // copied generated method, to specify the default value for `keepDuration`
        // and to avoid compilation error when it is overridden in HasDateConstraintMixin
        /**
         * Sets the event [[endDate|end date]].
         *
         * @param date The new end date to set
         * @param keepDuration Whether the intention is to keep the `duration` field (`keepDuration = true`) or `startDate` (`keepDuration = false`)
         */
        setEndDate (date : Date, keepDuration : boolean = false) : Promise<CommitResult> {
            if (this.graph) {
                this.graph.write(this.$.endDate, date, keepDuration)

                return this.graph.commitAsync()
            } else {
                this.$.endDate.DATA = date
            }
        }

        putEndDate : (date : Date, keepDuration? : boolean) => void


        @write('endDate')
        writeEndDate (me : Identifier, transaction : Transaction, quark : Quark, date : Date, keepDuration : boolean = false) {
            if (!transaction.baseRevision.hasIdentifier(me) && date == null) return

            me.constructor.prototype.write.call(this, me, transaction, quark, date, keepDuration)

            // TODO: review
            // const instruction : Instruction   = keepDuration ? Instruction.KeepDuration : Instruction.KeepStartDate
            // const dispatcher    = this.$.dispatcher as DispatcherIdentifier
        }


        /**
         * The main calculation method for the [[endDate]] field. Delegates to either [[calculateEndDateProposed]]
         * or [[calculateEndDatePure]], depending on the information from [[dispatcher]]
         */
        @calculate('endDate')
        * calculateEndDate () : CalculationIterator<Date> {
            const dispatch : SEDDispatcher = yield this.$.dispatcher

            const formulaId : FormulaId = dispatch.resolution.get(EndDateVar)

            if (formulaId === CalculateProposed) {
                return yield* this.calculateEndDateProposed()
            }
            else if (formulaId === endDateFormula.formulaId) {
                return yield* this.calculateEndDatePure()
                // the "new way" would be
                // return yield* this.calculateProjectedEndDateWithDuration(yield this.$.startDate, yield this.$.duration)
            } else {
                throw new Error("Unknown formula for `endDate`")
            }
        }


        /**
         * The "pure" calculation function of the [[endDate]] field. It should calculate the [[endDate]] as if
         * there's no user input for it and no previous value - "purely" based on the values of other fields.
         *
         * At this level it delegates to [[calculateProjectedXDateWithDuration]]
         *
         * See also [[calculateEndDateProposed]].
         */
        * calculateEndDatePure () : CalculationIterator<Date> {
            return yield* this.calculateProjectedXDateWithDuration(yield this.$.startDate, true, yield this.$.duration)
        }


        /**
         * The "proposed" calculation function of the [[endDate]] field. It should calculate the [[endDate]] as if
         * there's a user input for it or a previous value. It can also use the values of other fields to "validate"
         * the "proposed" value.
         *
         * See also [[calculateEndDatePure]]
         */
        * calculateEndDateProposed () : CalculationIterator<Date> {
            const endDate : Date            = yield ProposedOrPrevious

            return yield* this.skipNonWorkingTime(endDate, false)
        }
        //endregion


        //region duration
        /**
         * Duration getter. Returns the duration of the event, in the given unit. If unit is not given, returns duration in [[durationUnit]].
         *
         * @param unit
         */
        getDuration (unit? : TimeUnit) : Duration {
            const duration        = this.duration

            return unit !== undefined ? this.getProject().convertDuration(duration, this.durationUnit, unit) : duration
        }

        /**
         * Duration setter.
         *
         * @param duration The new duration to set.
         * @param unit The unit for new duration. Optional, if missing the [[durationUnit]] value will be used.
         * @param keepStart A boolean flag, indicating, whether the intention is to keep the start date (`true`) or end date (`false`)
         */
        setDuration (duration : Duration, unit? : TimeUnit, keepStart? : boolean) : Promise<CommitResult> {
            if (this.graph) {
                // Chronograph started to treat undefined as null, but we need to filter that case
                // https://github.com/bryntum/chronograph/issues/11
                if (duration !== undefined) {
                    this.graph.write(this.$.duration, duration, unit, keepStart)

                    return this.graph.commitAsync()
                }
            } else {
                this.$.duration.DATA = duration

                if (unit != null) this.$.durationUnit.DATA = unit
            }
        }

        setDurationUnit (_value : TimeUnit) {
            throw new Error("Use `setDuration` instead")
        }


        @write('duration')
        writeDuration (me : Identifier, transaction : Transaction, quark : Quark, duration : Duration, unit? : TimeUnit, keepStart : boolean | Instruction = undefined) {
            if (duration < 0) duration = 0

            if (!transaction.baseRevision.hasIdentifier(me) && duration == null) return

            me.constructor.prototype.write.call(this, me, transaction, quark, duration, keepStart)

            if (unit != null) transaction.write(this.$.durationUnit, unit)
        }



        /**
         * The main calculation method for the [[duration]] field. Delegates to either [[calculateDurationProposed]]
         * or [[calculateDurationPure]], depending on the information from [[dispatcher]]
         */
        @calculate('duration')
        * calculateDuration () : CalculationIterator<Duration> {
            const dispatch : SEDDispatcher = yield this.$.dispatcher

            const formulaId : FormulaId = dispatch.resolution.get(DurationVar)

            if (formulaId === CalculateProposed) {
                return yield* this.calculateDurationProposed()
            }
            else if (formulaId === durationFormula.formulaId) {
                return yield* this.calculateDurationPure()
                // the "new way" would be
                // return yield* this.calculateProjectedDuration(yield this.$.startDate, yield this.$.endDate)
            } else {
                throw new Error("Unknown formula for `duration`")
            }
        }


        /**
         * The "pure" calculation function of the [[duration]] field. It should calculate the [[duration]] as if
         * there's no user input for it and no previous value - "purely" based on the values of other fields.
         *
         * If start date of event is less or equal then end date (normal case) it delegates to [[calculateProjectedDuration]].
         * Otherwise duration is set to 0.
         *
         * See also [[calculateDurationProposed]].
         */
        * calculateDurationPure () : CalculationIterator<Duration> {
            const startDate : Date          = yield this.$.startDate
            const endDate : Date            = yield this.$.endDate

            if (!startDate || !endDate) return null

            if (startDate > endDate) {
                yield Write(this.$.duration, 0, null)
            }
            else {
                return yield* this.calculateProjectedDuration(startDate, endDate)
            }
        }


        /**
         * The "proposed" calculation function of the [[duration]] field. It should calculate the [[duration]] as if
         * there's a user input for it or a previous value. It can also use the values of other fields to "validate"
         * the "proposed" value.
         *
         * See also [[calculateDurationPure]]
         */
        * calculateDurationProposed () : CalculationIterator<Duration> {
            return yield ProposedOrPrevious
        }


        /**
         * This method calculates the duration of the given time span, in the provided `durationUnit` or in the [[durationUnit]].
         *
         * @param startDate
         * @param endDate
         * @param durationUnit
         */
        * calculateProjectedDuration (startDate : Date, endDate : Date, durationUnit? : TimeUnit) : CalculationIterator<Duration> {
            if (!startDate || !endDate) return null

            if (!durationUnit) durationUnit             = yield this.$.durationUnit

            const calendar : BaseCalendarMixin          = yield this.$.effectiveCalendar
            const project : this[ 'project' ]           = this.getProject()

            return yield* project.$convertDuration(calendar.calculateDurationMs(startDate, endDate), TimeUnit.Millisecond, durationUnit)
        }


        // effective duration is either a "normal" duration, or, if the duration itself is being calculated
        // (so that yielding it will cause a cycle)
        // an "estimated" duration, calculated based on proposed/previous start/end date values
        * calculateEffectiveDuration () : CalculationIterator<Duration> {
            const dispatch : SEDDispatcher              = yield this.$.dispatcher

            let effectiveDurationToUse : Duration

            const durationResolution : FormulaId        = dispatch.resolution.get(DurationVar)

            if (durationResolution === CalculateProposed) {
                effectiveDurationToUse  = yield this.$.duration
            }
            else if (durationResolution === durationFormula.formulaId) {
                effectiveDurationToUse  = yield* this.calculateProjectedDuration(
                    yield ProposedOrPreviousValueOf(this.$.startDate),
                    yield ProposedOrPreviousValueOf(this.$.endDate)
                )
            }

            return effectiveDurationToUse
        }
        //endregion


        //region direction
        /**
         * Getter for [[direction]] field.
         */
        getDirection : () => Direction

        /**
         * Setter for [[direction]] field.
         */
        setDirection : (value : Direction) => Promise<CommitResult>
        //endregion

    }

    return BaseEventMixin
}){}
