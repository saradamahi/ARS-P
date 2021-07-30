import { ProposedOrPrevious } from "../../ChronoGraph/chrono/Effect.js"
import { Quark, QuarkConstructor, TombStone } from "../../ChronoGraph/chrono/Quark.js"
import { Transaction } from '../../ChronoGraph/chrono/Transaction.js'
import { AnyConstructor, AnyFunction, ClassUnion, isInstanceOf, Mixin } from "../../ChronoGraph/class/BetterMixin.js"
import { CalculationContext } from "../../ChronoGraph/primitives/Calculation.js"
import { Entity, generic_field } from "../../ChronoGraph/replica/Entity.js"
import {
    FieldIdentifier,
    FieldIdentifierConstructor,
    MinimalFieldIdentifierGen,
    MinimalFieldIdentifierSync,
    MinimalFieldVariable
} from "../../ChronoGraph/replica/Identifier.js"
import { ReferenceField, ReferenceIdentifier } from "../../ChronoGraph/replica/Reference.js"
import {
    MinimalReferenceBucketQuark,
    ReferenceBucketField,
    ReferenceBucketIdentifier,
    ReferenceBucketQuark
} from "../../ChronoGraph/replica/ReferenceBucket.js"
import { ReadMode, Replica } from "../../ChronoGraph/replica/Replica.js"
import { Field } from "../../ChronoGraph/schema/Field.js"
import { isGeneratorFunction, prototypeValue } from "../../ChronoGraph/util/Helpers.js"
import DateHelper from "../../Core/helper/DateHelper.js"
import { ChronoModelMixin } from "./ChronoModelMixin.js"
import { EngineTransaction } from "./Replica.js"


//---------------------------------------------------------------------------------------------------------------------
export const KEEP_TRYING_TO_RESOLVE = Symbol('KEEP_TRYING_TO_RESOLVE')

// Fields

//---------------------------------------------------------------------------------------------------------------------
export type ModelFieldConfig = {
    type?               : string,
    isEqual?            : (a, b) => boolean,
    allowNull?          : boolean,
    defaultValue?       : any,
    format?             : string,
    dateFormat?         : string,
    persist?            : boolean,
    readOnly?           : boolean,
    convert?            : (value) => any,
    serialize?          : (value) => any
}

export const isSerializableEqual : (a, b) => boolean = function(oldValue, newValue) {
    return oldValue === newValue ||
        (newValue?.isBase ? this.serialize(newValue) : newValue) == (oldValue?.isBase ? this.serialize(oldValue) : oldValue);
}

//---------------------------------------------------------------------------------------------------------------------
export class ModelField extends Field {
    identifierCls       : FieldIdentifierConstructor

    converter           : AnyFunction

    modelFieldConfig    : ModelFieldConfig  = {}


    getIdentifierClass (calculationFunction : AnyFunction) : FieldIdentifierConstructor {
        if (this.identifierCls) return this.identifierCls

        if (!calculationFunction) return MinimalChronoModelFieldVariable

        return isGeneratorFunction(calculationFunction) ? MinimalChronoModelFieldIdentifierGen : MinimalChronoModelFieldIdentifierSync
    }
}


//---------------------------------------------------------------------------------------------------------------------
export class ModelReferenceField extends ReferenceField.mix(ModelField) {
    identifierCls             : FieldIdentifierConstructor   = ChronoModelReferenceFieldIdentifier
}


//---------------------------------------------------------------------------------------------------------------------
// it seems we don't need the buckets as Core fields, the `ModelBucketField` can be removed completely
export class ModelBucketField extends ReferenceBucketField.mix(Field) {
    identifierCls             : FieldIdentifierConstructor   = ChronoModelReferenceBucketFieldIdentifier

    // initialize (...args) {
    //     super.initialize(...args)
    //
    //     // the default value is actually shared among all instances (which is ok, since its assumed to be immutable)
    //     this.modelFieldConfig   = Object.assign({ isEqual : () => false, defaultValue : new Set(), persist : false }, this.modelFieldConfig)
    // }
}

// eof Fields


// Atoms

export const IsChronoModelSymbol   = Symbol('IsChronoModelSymbol')

//---------------------------------------------------------------------------------------------------------------------
export class ChronoModelFieldIdentifier extends Mixin(
    [ FieldIdentifier ],
    (base : AnyConstructor<FieldIdentifier, typeof FieldIdentifier>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class ChronoModelFieldIdentifier extends base {
        [IsChronoModelSymbol] () {}

        @prototypeValue(false)
        sync        : boolean

        self        : ChronoModelMixin


        getFromGraph (graph : Replica) : this[ 'ValueT' ] | Promise<this[ 'ValueT' ]> {
            if (graph) {
                if (graph.readMode === ReadMode.CurrentOrProposedOrPrevious) {
                    if (this.sync)
                        return graph.get(this)
                    else
                        return graph.activeTransaction.readCurrentOrProposedOrPrevious(this)
                }

                return superProto.getFromGraph.call(this, graph)
            } else
                return this.DATA
        }

        writeToGraph (graph : Replica, proposedValue : this[ 'ValueT' ], ...args : this[ 'ArgsT' ]) {
            if (graph) {
               superProto.writeToGraph.call(this, graph, proposedValue, ...args)
            }
            else {
                this.DATA = proposedValue;
                //@ts-ignore
                this.self.set(this.field.name, proposedValue, false, false, true)
            }
        }

        write (me : this, transaction : Transaction, quark : InstanceType<this["quarkClass"]>, proposedValue : this[ 'ValueT' ], ...args) {

            // convert proposed value if needed
            proposedValue = me.convert(proposedValue)

            superProto.write.call(this, me, transaction, quark, proposedValue, ...args)
        }


        convert (value : any) : any {
            const field : ModelField    = this.field as ModelField

            const fieldDefinition : ModelFieldConfig = this.self.getFieldDefinition(field.name)

            // use field definition provided "convert" function
            if (fieldDefinition?.convert) {
                value           = fieldDefinition.convert(value)
            // fallback to atom defined "converter"
            } else if (field.converter) {
                value           = field.converter(value, field)
            }

            return value
        }


        equality (v1 : any, v2 : any) : boolean {
            if ((v1 instanceof Date) && (v2 instanceof Date)) return v1.getTime() === v2.getTime()

            return v1 === v2
        }
    }

    return ChronoModelFieldIdentifier
}){}


//---------------------------------------------------------------------------------------------------------------------
export class ChronoModelReferenceFieldQuark extends Mixin(
    [ ReferenceBucketQuark ],
    (base : ClassUnion<typeof ReferenceBucketQuark>) => {

    const superProto : InstanceType<typeof base> = base.prototype

    class ChronoModelReferenceFieldQuark extends base {

        setValue (value : any) {
            superProto.setValue.call(this, value)

            // keep the copy of value on the identifier itself, to make it available
            // after the identifier is removed from the graph
            //@ts-ignore
            if (value !== TombStone) this.identifier.DATA = value
        }
    }

    return ChronoModelReferenceFieldQuark

}){}



export const MinimalChronoModelReferenceFieldQuark = ChronoModelReferenceFieldQuark.mix(MinimalReferenceBucketQuark)


export class ChronoModelReferenceFieldIdentifier extends ReferenceIdentifier.mix(ChronoModelFieldIdentifier.mix(MinimalFieldIdentifierSync)) {
    @prototypeValue(true)
    sync        : boolean

    @prototypeValue(MinimalChronoModelReferenceFieldQuark)
    quarkClass          : QuarkConstructor


    buildProposedValue (me : this, q : Quark, transaction : EngineTransaction) : this[ 'ValueT' ] {
        const quark             = q as ChronoModelReferenceFieldQuark

        const proposedValue     = quark.proposedValue

        if (proposedValue === null) {
            transaction.candidate.failedResolutionReferences.delete(quark.identifier)

            return null
        }

        if (isInstanceOf(proposedValue, Entity)) {
            if (me.hasBucket()) me.getBucket(proposedValue).addToBucket(transaction, me.self)

            transaction.candidate.failedResolutionReferences.delete(quark.identifier)

            return proposedValue
        }

        const resolved : Entity    = me.resolve(proposedValue)

        if (isInstanceOf(resolved, Entity)) {
            if (me.hasBucket()) me.getBucket(resolved).addToBucket(transaction, me.self)

            transaction.candidate.failedResolutionReferences.delete(quark.identifier)

            return resolved
        } else {
            transaction.candidate.failedResolutionReferences.set(quark.identifier, proposedValue)

            return null
        }
    }
}


//---------------------------------------------------------------------------------------------------------------------
export class ChronoModelReferenceBucketFieldIdentifier extends ReferenceBucketIdentifier.mix(ChronoModelFieldIdentifier.mix(MinimalFieldIdentifierSync)) {
    @prototypeValue(true)
    sync        : boolean
}


export class MinimalChronoModelFieldIdentifierSync extends ChronoModelFieldIdentifier.mix(MinimalFieldIdentifierSync) {}
export class MinimalChronoModelFieldIdentifierGen extends ChronoModelFieldIdentifier.mix(MinimalFieldIdentifierGen) {}
export class MinimalChronoModelFieldVariable extends ChronoModelFieldIdentifier.mix(MinimalFieldVariable) {}


// eof Atoms


export const model_field = function (
    modelFieldConfig : ModelFieldConfig = {}, chronoFieldConfig : Partial<ModelField> = {}, chronoFieldClass : typeof ModelField = ModelField
) : PropertyDecorator {

    return function (target : Entity, propertyKey : string) : void {
        const decoratorFn = generic_field({ modelFieldConfig, ...chronoFieldConfig }, chronoFieldClass)

        decoratorFn(target, propertyKey)

        injectStaticFieldsProperty(target.constructor)
    }
}


export const injectStaticFieldsProperty = (prototype : object) => {
    if (!prototype.hasOwnProperty('fields')) {
        Object.defineProperty(prototype, 'fields', {
            get : function () {
                return getDecoratedModelFields(this)
            }
        })
    }
}


export const getDecoratedModelFields = (constr : AnyConstructor) : object[] => {
    const proto  = constr.prototype
    const result = []

    if (proto.hasOwnProperty('$entity')) {
        proto.$entity.ownFields.forEach((field : Field) => {
            if (field instanceof ModelField) {
                const config = field.modelFieldConfig || {}

                if (!config.convert && field.converter && field.converter !== dateConverter) {
                    config.convert = field.converter
                }

                result.push(Object.assign(config, {
                    $chrono : field,
                    name    : field.name
                }))
            }
        })
    }

    return result
}


export const dateConverter = (date : Date | string, field : ModelField) => {
    if (date === null) {
        return null
    }

    if (!(date instanceof Date)) {
        date = DateHelper.parse(date, field.modelFieldConfig?.format || field.modelFieldConfig?.dateFormat ||
            DateHelper.defaultParseFormat)
    }

    // if parsing has failed, we would like to return `undefined` to indicate the "absence" of data
    // instead of `null` (presence of "empty" data)
    return date || undefined
}
