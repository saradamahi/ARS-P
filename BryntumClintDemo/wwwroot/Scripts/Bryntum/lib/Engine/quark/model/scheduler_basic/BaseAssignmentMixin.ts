import { AnyConstructor, Mixin } from '../../../../ChronoGraph/class/BetterMixin.js'
import { generic_field } from '../../../../ChronoGraph/replica/Entity.js'
import { ModelReferenceField, injectStaticFieldsProperty, isSerializableEqual } from '../../../chrono/ModelFieldAtom.js'
import { ChronoPartOfProjectModelMixin } from '../mixin/ChronoPartOfProjectModelMixin.js'
import { BaseResourceMixin } from './BaseResourceMixin.js'
import { BaseHasAssignmentsMixin } from './BaseHasAssignmentsMixin.js'

/**
 * Base assignment model class. It just contains references to the [[BaseEventMixin|event]] and [[BaseResourceMixin|resource]] being assigned.
 */
export class BaseAssignmentMixin extends Mixin(
    [ ChronoPartOfProjectModelMixin ],
    (base : AnyConstructor<ChronoPartOfProjectModelMixin, typeof ChronoPartOfProjectModelMixin>) => {

    const superProto : InstanceType<typeof base> = base.prototype


    class BaseAssignmentMixin extends base {
        /**
         * An event being assigned
         */
        @generic_field(
            {
                bucket           : 'assigned',
                resolver         : function (id) { return this.getEventById(id) },
                modelFieldConfig : {
                    serialize : event => event?.id,
                    isEqual   : isSerializableEqual,
                    persist   : false
                }
            },
            ModelReferenceField
        )
        event      : BaseHasAssignmentsMixin

        /**
         * A resource being assigned
         */
        @generic_field(
            {
                bucket           : 'assigned',
                resolver         : function (id) { return this.getResourceById(id) },
                modelFieldConfig : {
                    serialize : resource => resource?.id,
                    isEqual   : isSerializableEqual,
                    persist   : false
                }
            },
            ModelReferenceField
        )
        resource    : BaseResourceMixin
    }

    // inject "fields" getter override to apply "modelFieldConfig" to "event" & "resource" fields
    injectStaticFieldsProperty(BaseAssignmentMixin)

    return BaseAssignmentMixin
}){}
