var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { TombStone } from "../../ChronoGraph/chrono/Quark.js";
import { isInstanceOf, Mixin } from "../../ChronoGraph/class/BetterMixin.js";
import { Entity, generic_field } from "../../ChronoGraph/replica/Entity.js";
import { FieldIdentifier, MinimalFieldIdentifierGen, MinimalFieldIdentifierSync, MinimalFieldVariable } from "../../ChronoGraph/replica/Identifier.js";
import { ReferenceField, ReferenceIdentifier } from "../../ChronoGraph/replica/Reference.js";
import { MinimalReferenceBucketQuark, ReferenceBucketField, ReferenceBucketIdentifier, ReferenceBucketQuark } from "../../ChronoGraph/replica/ReferenceBucket.js";
import { ReadMode } from "../../ChronoGraph/replica/Replica.js";
import { Field } from "../../ChronoGraph/schema/Field.js";
import { isGeneratorFunction, prototypeValue } from "../../ChronoGraph/util/Helpers.js";
import DateHelper from "../../Core/helper/DateHelper.js";
export const KEEP_TRYING_TO_RESOLVE = Symbol('KEEP_TRYING_TO_RESOLVE');
export const isSerializableEqual = function (oldValue, newValue) {
    return oldValue === newValue ||
        ((newValue === null || newValue === void 0 ? void 0 : newValue.isBase) ? this.serialize(newValue) : newValue) == ((oldValue === null || oldValue === void 0 ? void 0 : oldValue.isBase) ? this.serialize(oldValue) : oldValue);
};
export class ModelField extends Field {
    constructor() {
        super(...arguments);
        this.modelFieldConfig = {};
    }
    getIdentifierClass(calculationFunction) {
        if (this.identifierCls)
            return this.identifierCls;
        if (!calculationFunction)
            return MinimalChronoModelFieldVariable;
        return isGeneratorFunction(calculationFunction) ? MinimalChronoModelFieldIdentifierGen : MinimalChronoModelFieldIdentifierSync;
    }
}
export class ModelReferenceField extends ReferenceField.mix(ModelField) {
    constructor() {
        super(...arguments);
        this.identifierCls = ChronoModelReferenceFieldIdentifier;
    }
}
export class ModelBucketField extends ReferenceBucketField.mix(Field) {
    constructor() {
        super(...arguments);
        this.identifierCls = ChronoModelReferenceBucketFieldIdentifier;
    }
}
export const IsChronoModelSymbol = Symbol('IsChronoModelSymbol');
export class ChronoModelFieldIdentifier extends Mixin([FieldIdentifier], (base) => {
    const superProto = base.prototype;
    class ChronoModelFieldIdentifier extends base {
        [IsChronoModelSymbol]() { }
        getFromGraph(graph) {
            if (graph) {
                if (graph.readMode === ReadMode.CurrentOrProposedOrPrevious) {
                    if (this.sync)
                        return graph.get(this);
                    else
                        return graph.activeTransaction.readCurrentOrProposedOrPrevious(this);
                }
                return superProto.getFromGraph.call(this, graph);
            }
            else
                return this.DATA;
        }
        writeToGraph(graph, proposedValue, ...args) {
            if (graph) {
                superProto.writeToGraph.call(this, graph, proposedValue, ...args);
            }
            else {
                this.DATA = proposedValue;
                this.self.set(this.field.name, proposedValue, false, false, true);
            }
        }
        write(me, transaction, quark, proposedValue, ...args) {
            proposedValue = me.convert(proposedValue);
            superProto.write.call(this, me, transaction, quark, proposedValue, ...args);
        }
        convert(value) {
            const field = this.field;
            const fieldDefinition = this.self.getFieldDefinition(field.name);
            if (fieldDefinition === null || fieldDefinition === void 0 ? void 0 : fieldDefinition.convert) {
                value = fieldDefinition.convert(value);
            }
            else if (field.converter) {
                value = field.converter(value, field);
            }
            return value;
        }
        equality(v1, v2) {
            if ((v1 instanceof Date) && (v2 instanceof Date))
                return v1.getTime() === v2.getTime();
            return v1 === v2;
        }
    }
    __decorate([
        prototypeValue(false)
    ], ChronoModelFieldIdentifier.prototype, "sync", void 0);
    return ChronoModelFieldIdentifier;
}) {
}
export class ChronoModelReferenceFieldQuark extends Mixin([ReferenceBucketQuark], (base) => {
    const superProto = base.prototype;
    class ChronoModelReferenceFieldQuark extends base {
        setValue(value) {
            superProto.setValue.call(this, value);
            if (value !== TombStone)
                this.identifier.DATA = value;
        }
    }
    return ChronoModelReferenceFieldQuark;
}) {
}
export const MinimalChronoModelReferenceFieldQuark = ChronoModelReferenceFieldQuark.mix(MinimalReferenceBucketQuark);
export class ChronoModelReferenceFieldIdentifier extends ReferenceIdentifier.mix(ChronoModelFieldIdentifier.mix(MinimalFieldIdentifierSync)) {
    buildProposedValue(me, q, transaction) {
        const quark = q;
        const proposedValue = quark.proposedValue;
        if (proposedValue === null) {
            transaction.candidate.failedResolutionReferences.delete(quark.identifier);
            return null;
        }
        if (isInstanceOf(proposedValue, Entity)) {
            if (me.hasBucket())
                me.getBucket(proposedValue).addToBucket(transaction, me.self);
            transaction.candidate.failedResolutionReferences.delete(quark.identifier);
            return proposedValue;
        }
        const resolved = me.resolve(proposedValue);
        if (isInstanceOf(resolved, Entity)) {
            if (me.hasBucket())
                me.getBucket(resolved).addToBucket(transaction, me.self);
            transaction.candidate.failedResolutionReferences.delete(quark.identifier);
            return resolved;
        }
        else {
            transaction.candidate.failedResolutionReferences.set(quark.identifier, proposedValue);
            return null;
        }
    }
}
__decorate([
    prototypeValue(true)
], ChronoModelReferenceFieldIdentifier.prototype, "sync", void 0);
__decorate([
    prototypeValue(MinimalChronoModelReferenceFieldQuark)
], ChronoModelReferenceFieldIdentifier.prototype, "quarkClass", void 0);
export class ChronoModelReferenceBucketFieldIdentifier extends ReferenceBucketIdentifier.mix(ChronoModelFieldIdentifier.mix(MinimalFieldIdentifierSync)) {
}
__decorate([
    prototypeValue(true)
], ChronoModelReferenceBucketFieldIdentifier.prototype, "sync", void 0);
export class MinimalChronoModelFieldIdentifierSync extends ChronoModelFieldIdentifier.mix(MinimalFieldIdentifierSync) {
}
export class MinimalChronoModelFieldIdentifierGen extends ChronoModelFieldIdentifier.mix(MinimalFieldIdentifierGen) {
}
export class MinimalChronoModelFieldVariable extends ChronoModelFieldIdentifier.mix(MinimalFieldVariable) {
}
export const model_field = function (modelFieldConfig = {}, chronoFieldConfig = {}, chronoFieldClass = ModelField) {
    return function (target, propertyKey) {
        const decoratorFn = generic_field(Object.assign({ modelFieldConfig }, chronoFieldConfig), chronoFieldClass);
        decoratorFn(target, propertyKey);
        injectStaticFieldsProperty(target.constructor);
    };
};
export const injectStaticFieldsProperty = (prototype) => {
    if (!prototype.hasOwnProperty('fields')) {
        Object.defineProperty(prototype, 'fields', {
            get: function () {
                return getDecoratedModelFields(this);
            }
        });
    }
};
export const getDecoratedModelFields = (constr) => {
    const proto = constr.prototype;
    const result = [];
    if (proto.hasOwnProperty('$entity')) {
        proto.$entity.ownFields.forEach((field) => {
            if (field instanceof ModelField) {
                const config = field.modelFieldConfig || {};
                if (!config.convert && field.converter && field.converter !== dateConverter) {
                    config.convert = field.converter;
                }
                result.push(Object.assign(config, {
                    $chrono: field,
                    name: field.name
                }));
            }
        });
    }
    return result;
};
export const dateConverter = (date, field) => {
    var _a, _b;
    if (date === null) {
        return null;
    }
    if (!(date instanceof Date)) {
        date = DateHelper.parse(date, ((_a = field.modelFieldConfig) === null || _a === void 0 ? void 0 : _a.format) || ((_b = field.modelFieldConfig) === null || _b === void 0 ? void 0 : _b.dateFormat) ||
            DateHelper.defaultParseFormat);
    }
    return date || undefined;
};
