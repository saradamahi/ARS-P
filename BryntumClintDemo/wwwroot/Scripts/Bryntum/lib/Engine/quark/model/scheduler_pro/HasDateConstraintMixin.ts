import { ProposedOrPrevious, ProposedOrPreviousValueOf } from '../../../../ChronoGraph/chrono/Effect.js'
import { CommitResult } from '../../../../ChronoGraph/chrono/Graph.js'
import { Identifier } from "../../../../ChronoGraph/chrono/Identifier.js"
import { Quark } from "../../../../ChronoGraph/chrono/Quark.js"
import { Transaction } from "../../../../ChronoGraph/chrono/Transaction.js"
import { AnyConstructor, Mixin } from '../../../../ChronoGraph/class/BetterMixin.js'
import { CalculationIterator } from '../../../../ChronoGraph/primitives/Calculation.js'
import { calculate } from '../../../../ChronoGraph/replica/Entity.js'
import { dateConverter, model_field } from '../../../chrono/ModelFieldAtom.js'
import { DateInterval } from '../../../scheduling/DateInterval.js'
import { ConstraintType, Direction } from '../../../scheduling/Types.js'
import { HasChildrenMixin } from '../scheduler_basic/HasChildrenMixin.js'
import { ConstrainedEarlyEventMixin } from './ConstrainedEarlyEventMixin.js'

/**
 * This mixin implements a date-based based constraint for the event.
 * It provides the following constraint types:
 *
 * - _Start no earlier than (SNET)_ - restricts the event to start on or after the specified date.
 * - _Finish no earlier than (FNET)_ - restricts the event to finish on or after the specified date.
 * - _Start no later than (SNLT)_ - restricts the event to start before (or on) the specified date.
 * - _Finish no later than (FNLT)_ - restricts the event to finish before (or on) the specified date.
 * - _Must start on (MSO)_ - restricts the event to start on the specified date.
 * - _Must finish on (MFO)_ - restricts the event to finish on the specified date.
 *
 * The type of constraint is defined by the [[constraintType]] property. Types has self-descriptive names.
 * There's also [[constraintDate]] with a constraint date.
 *
 */
export class HasDateConstraintMixin extends Mixin(
    [ ConstrainedEarlyEventMixin, HasChildrenMixin ],
    (base : AnyConstructor<ConstrainedEarlyEventMixin & HasChildrenMixin, typeof ConstrainedEarlyEventMixin & typeof HasChildrenMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class HasDateConstraint extends base {

        /**
         * The type of constraint, applied to this event
         */
        @model_field({ type : 'string' }, { sync : true })
        constraintType : ConstraintType

        /**
         * The date of the constraint, applied to this event
         */
        @model_field({ type : 'date' }, { converter : dateConverter, sync : true })
        constraintDate : Date


        writeStartDate (me : Identifier, transaction : Transaction, quark : Quark, date : Date, keepDuration : boolean = true) {
            // get constraint type that should be used to enforce start date or
            // null if the change cannot be enforced (happens when the task is manually scheduled so no need for enforcement or
            // some constraint is already set)

            const project = this.getProject()

            // `writeStartDate` will be called for initial write to the `startDate` at the point of adding it to graph
            // at that time there possibly be no `direction` identifier yet
            // it seems this line relies on the fact, that `direction` field is declared after the `startDate`
            if (transaction.graph.hasIdentifier(this.$.direction) && !(project && project.getStm().isRestoring)) {
                const constrainType = this.getStartDatePinConstraintType()

                if (constrainType) {
                    this.constraintType = constrainType
                    this.constraintDate = date
                }
            }

            return superProto.writeStartDate.call(this, me, transaction, quark, date, keepDuration)
        }


        writeEndDate (me : Identifier, transaction : Transaction, quark : Quark, date : Date, keepDuration : boolean = false) {
            // get constraint type that should be used to enforce End date or
            // null if the change cannot be enforced (happens when the task is manually scheduled so no need for enforcement or
            // some constraint is already set)

            const project = this.getProject()

            if (transaction.graph.hasIdentifier(this.$.direction) && keepDuration && !(project && project.getStm().isRestoring)) {
                const constrainType = this.getEndDatePinConstraintType()

                if (constrainType) {
                    this.constraintType = constrainType
                    this.constraintDate = date
                }
            }

            return superProto.writeEndDate.call(this, me, transaction, quark, date, keepDuration)
        }


        @calculate('constraintType')
        * calculateConstraintType () : CalculationIterator<ConstraintType> {
            let constraintType : this[ 'constraintType' ]    = yield ProposedOrPrevious

            // use proposed constraint type if provided and is applicable to the event
            if (!(yield* this.isConstraintTypeApplicable(constraintType))) {
                constraintType   = null
            }

            return constraintType
        }


        @calculate('constraintDate')
        * calculateConstraintDate (Y) : CalculationIterator<Date> {

            let constraintDate : Date               = yield ProposedOrPrevious
            const constraintType : ConstraintType   = yield this.$.constraintType

            if (!constraintType) {
                constraintDate      = null
            }
            // use proposed constraint date if provided
            else if (!constraintDate) {
                // fill constraint date based on constraint type provided
                constraintDate      = this.getConstraintTypeDefaultDate(Y, constraintType)
            }

            return constraintDate
        }


        getStartDatePinConstraintType () : ConstraintType {
            const { direction } = this

            if (!this.isTaskPinnableWithConstraint()) return null

            switch (direction) {
                case Direction.Forward : return ConstraintType.StartNoEarlierThan

                case Direction.Backward : return ConstraintType.FinishNoLaterThan
            }
        }


        getEndDatePinConstraintType () : ConstraintType {
            const { direction } = this

            if (!this.isTaskPinnableWithConstraint()) return null

            switch (direction) {
                case Direction.Forward : return ConstraintType.FinishNoEarlierThan

                case Direction.Backward : return ConstraintType.FinishNoLaterThan
            }
        }


        /**
         * Indicates if the task can be pinned with a constraint
         * to enforce its start/end date changes.
         * @private
         */
        isTaskPinnableWithConstraint () : boolean {
            const { manuallyScheduled, constraintType } = this

            let result = false

            // we should not pin manually scheduled tasks
            if (!manuallyScheduled) {

                if (constraintType) {
                    switch (constraintType) {
                        case ConstraintType.StartNoEarlierThan :
                        case ConstraintType.StartNoLaterThan :
                        case ConstraintType.FinishNoEarlierThan :
                        case ConstraintType.FinishNoLaterThan :
                            result = true
                    }
                }
                // no constraints -> we can pin
                else {
                    result = true
                }
            }

            return result
        }


        /**
         * Returns default constraint date value for the constraint type provided
         * (either start or end date of the event).
         */
        getConstraintTypeDefaultDate (Y, constraintType : ConstraintType) : Date {
            switch (constraintType) {
                case ConstraintType.StartNoEarlierThan :
                case ConstraintType.StartNoLaterThan :
                case ConstraintType.MustStartOn :
                    return Y(ProposedOrPreviousValueOf(this.$.startDate))

                case ConstraintType.FinishNoEarlierThan :
                case ConstraintType.FinishNoLaterThan :
                case ConstraintType.MustFinishOn :
                    return Y(ProposedOrPreviousValueOf(this.$.endDate))
            }

            return null
        }

        /**
         * Returns true if the provided constraint type is applicable to the event.
         *
         * @param {ConstraintType} constraintType Constraint type.
         * @returns `True` if the provided constraint type is applicable (`false` otherwise).
         */
        * isConstraintTypeApplicable (constraintType : ConstraintType) : CalculationIterator<boolean> {
            const childEvents = yield this.$.childEvents

            // Take into account if the event is leaf
            const isSummary : boolean = childEvents.size > 0

            switch (constraintType) {
                // these constraints are applicable to leaves only
                case ConstraintType.FinishNoEarlierThan :
                case ConstraintType.StartNoLaterThan :
                case ConstraintType.MustFinishOn :
                case ConstraintType.MustStartOn :
                    return !isSummary
            }

            return true
        }

        /**
         * Sets the [[constraintType|constraint type]] of the event.
         * @param {ConstraintType} constraintType Constraint type.
         * @returns Promise<PropagateResult>
         */
        setConstraintType : (constrainType : ConstraintType) => Promise<CommitResult>

        /**
         * Sets the [[constraintDate|constraint date]] of the event.
         * @param {Date}   constraintDate Constraint date.
         * @returns Promise<PropagateResult>
         */
        setConstraintDate : (constrainDate : Date) => Promise<CommitResult>

        /**
         * Sets the constraint type (if applicable) and constraining date to the task.
         * @param {ConstraintType}  constraintType   Constraint type.
         * @param {Date}            [constraintDate] Constraint date.
         * @returns Promise<PropagateResult>
         */
        async setConstraint (constraintType : ConstraintType, constraintDate? : Date) : Promise<CommitResult> {
            this.constraintType = constraintType

            if (constraintDate !== undefined) {
                this.constraintDate = constraintDate
            }

            return this.commitAsync()
        }


        * calculateEndDateConstraintIntervals () : CalculationIterator<this[ 'endDateConstraintIntervals' ]> {
            const intervals : this[ 'endDateConstraintIntervals' ] = yield* superProto.calculateEndDateConstraintIntervals.call(this)

            const constraintType : ConstraintType   = yield this.$.constraintType
            const constraintDate : Date             = yield this.$.constraintDate

            if (constraintType && constraintDate) {
                // if constraint type is
                switch (constraintType) {
                    case ConstraintType.MustFinishOn :
                        intervals.unshift(DateInterval.new({
                            startDate   : constraintDate,
                            endDate     : constraintDate
                        }))
                        break

                    case ConstraintType.FinishNoEarlierThan :
                        intervals.unshift(DateInterval.new({
                            startDate   : constraintDate
                        }))
                        break

                    case ConstraintType.FinishNoLaterThan :
                        intervals.unshift(DateInterval.new({
                            endDate     : constraintDate
                        }))
                        break
                }
            }

            return intervals
        }


        * calculateStartDateConstraintIntervals () : CalculationIterator<this[ 'startDateConstraintIntervals' ]> {
            const intervals : this[ 'startDateConstraintIntervals' ] = yield* superProto.calculateStartDateConstraintIntervals.call(this)

            const constraintType : ConstraintType   = yield this.$.constraintType
            const constraintDate : Date             = yield this.$.constraintDate

            if (constraintType && constraintDate) {
                // if constraint type is
                switch (constraintType) {
                    case ConstraintType.MustStartOn :
                        intervals.unshift(DateInterval.new({
                            startDate   : constraintDate,
                            endDate     : constraintDate
                        }))
                        break

                    case ConstraintType.StartNoEarlierThan :
                        intervals.unshift(DateInterval.new({
                            startDate   : constraintDate
                        }))
                        break

                    case ConstraintType.StartNoLaterThan :
                        intervals.unshift(DateInterval.new({
                            endDate     : constraintDate
                        }))
                        break
                }
            }

            return intervals
        }

    }

    return HasDateConstraint
}){}
