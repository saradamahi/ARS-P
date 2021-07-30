import { AnyConstructor, Mixin } from "../../ChronoGraph/class/BetterMixin.js"
import { Entity } from "../../ChronoGraph/replica/Entity.js"
import { ModelId } from "../quark/Types.js"
import Model from "../../Core/data/Model.js"
import ObjectHelper from "../../Core/helper/ObjectHelper.js"

/**
 * This is a base mixin, which mixes together the ChronoGraph's [Entity](https://bryntum.github.io/chronograph/docs/modules/_src_replica_entity_.html)
 * and the Bryntum Core [Model](https://www.bryntum.com/docs/grid/#Core/data/Model)
 *
 * It is used as a very base mixin for all other entities in the project.
 */
export class ChronoModelMixin extends Mixin(
    [ Entity, Model ],
    (base : AnyConstructor<Model & Entity, typeof Model & typeof Entity>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class ChronoModelMixin extends base {

        construct (config, ...args : any[]) {
            // this is to force the fields creation, because we need all fields to be created
            // for the `this.getFieldDefinition()` to return correct result
            // @ts-ignore
            this.constructor.exposeProperties()

            // Cache original data before we recreate the incoming data here.
            // @ts-ignore
            this.originalData       = (config = config || {})

            // Populate record with all data, it will sort the configs out.
            // By doing this first, we can feed engine the converted values right away. Needed to satisfy tests that
            // use standalone stores, otherwise they will be getting the unconverted values since there is no graph.
            superProto.construct.call(this, config, ...args)
        }


        copy (newId : ModelId = null, deep = null) : this {
            const copy = superProto.copy.call(this, newId, deep)

            // If deep is everything but object - use default behavior, which is to invoke accessors
            // If deep is an object, check if it has certain field disabled
            if ((ObjectHelper.isObject(deep) && !deep.skipFieldIdentifiers) || !ObjectHelper.isObject(deep)) {
                this.forEachFieldIdentifier((identifier, fieldName) => {
                    copy[ fieldName ] = this[ fieldName ]
                })
            }

            return copy
        }


        _data           : object


        applyValue (useProp : boolean, key : string, value : any, skipAccessors : boolean, field : any) {
            const chronoField   = this.$entity.getField(key)

            if (chronoField) useProp = true
            if (skipAccessors) {
                useProp = false
            }

            superProto.applyValue.call(this, useProp, key, value, skipAccessors, field)
        }

        afterChange (toSet : any, wasSet : any, silent : boolean, fromRelationUpdate : boolean, skipAccessors : boolean) {

            // When model.set({...}) is called and chrono field is modified, afterChange will be invoked twice:
            // 1. call will forward value to the chrono, leaving model.data intact
            // 2. value was changed, so model.afterChange is called too, triggering `update` event on store
            // 3. autoCommit is scheduled
            // 4. autoCommit finalizes, calling endBatch
            // 5. endBatch calls `set` again, passing argument `skipAccessors = true`, which means data will be set to
            // the `model.data` now
            // 6. since value differs in chrono and in model.data, `afterChange` will be called once again
            // Naturally this leads to two identical events being fired for this call:
            // `dependency.set('type', 0)
            //
            // Idea of the fix is to mute events for the first call IF chrono field is in the `wasSet` object
            // Covered by DependencyEdit.t.js
            if (!skipAccessors && Object.keys(wasSet).some(key => this.$entity.getField(key))) {
                // @ts-ignore
                superProto.afterChange.call(this, toSet, wasSet, true, fromRelationUpdate, skipAccessors)
            }
            else {
                // @ts-ignore
                superProto.afterChange.apply(this, arguments)
            }
        }


        get data () : object {
            return this._data
        }


        set data (data : object) {
            this._data  = data

            // Have to iterate over defined fields and not keys in supplied data, in case nested mappings are used

            const { fields } = this

            for (let i = 0; i < fields.length; i++)  {
                const field           = fields[i]
                const chronoField     = this.$entity.getField(field.name)

                if (chronoField) {
                    const value = field.complexMapping
                        ? ObjectHelper.getPath(data, field.dataSource)
                        : data[ field.dataSource ]
                    // Use the predefined name for engine (name, startDate)
                    this[ field.name ] = value
                }
            }
        }


        get $entityName () : string {
            const className     = this.constructor.name || this.$entity.name

            const id            = this.id

            return `${className}${ id != null ? '-' + String(id) : '' }`
        }
    }

    return ChronoModelMixin
}){}
