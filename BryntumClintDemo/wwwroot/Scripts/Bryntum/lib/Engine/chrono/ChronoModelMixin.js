import { Mixin } from "../../ChronoGraph/class/BetterMixin.js";
import { Entity } from "../../ChronoGraph/replica/Entity.js";
import Model from "../../Core/data/Model.js";
import ObjectHelper from "../../Core/helper/ObjectHelper.js";
export class ChronoModelMixin extends Mixin([Entity, Model], (base) => {
    const superProto = base.prototype;
    class ChronoModelMixin extends base {
        construct(config, ...args) {
            this.constructor.exposeProperties();
            this.originalData = (config = config || {});
            superProto.construct.call(this, config, ...args);
        }
        copy(newId = null, deep = null) {
            const copy = superProto.copy.call(this, newId, deep);
            if ((ObjectHelper.isObject(deep) && !deep.skipFieldIdentifiers) || !ObjectHelper.isObject(deep)) {
                this.forEachFieldIdentifier((identifier, fieldName) => {
                    copy[fieldName] = this[fieldName];
                });
            }
            return copy;
        }
        applyValue(useProp, key, value, skipAccessors, field) {
            const chronoField = this.$entity.getField(key);
            if (chronoField)
                useProp = true;
            if (skipAccessors) {
                useProp = false;
            }
            superProto.applyValue.call(this, useProp, key, value, skipAccessors, field);
        }
        afterChange(toSet, wasSet, silent, fromRelationUpdate, skipAccessors) {
            if (!skipAccessors && Object.keys(wasSet).some(key => this.$entity.getField(key))) {
                superProto.afterChange.call(this, toSet, wasSet, true, fromRelationUpdate, skipAccessors);
            }
            else {
                superProto.afterChange.apply(this, arguments);
            }
        }
        get data() {
            return this._data;
        }
        set data(data) {
            this._data = data;
            const { fields } = this;
            for (let i = 0; i < fields.length; i++) {
                const field = fields[i];
                const chronoField = this.$entity.getField(field.name);
                if (chronoField) {
                    const value = field.complexMapping
                        ? ObjectHelper.getPath(data, field.dataSource)
                        : data[field.dataSource];
                    this[field.name] = value;
                }
            }
        }
        get $entityName() {
            const className = this.constructor.name || this.$entity.name;
            const id = this.id;
            return `${className}${id != null ? '-' + String(id) : ''}`;
        }
    }
    return ChronoModelMixin;
}) {
}
