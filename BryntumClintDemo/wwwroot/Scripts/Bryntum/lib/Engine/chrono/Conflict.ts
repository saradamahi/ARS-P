import { Effect } from "../../ChronoGraph/chrono/Effect.js"
import { Base } from "../../ChronoGraph/class/BetterMixin.js"
import { prototypeValue } from "../../ChronoGraph/util/Helpers.js"


//---------------------------------------------------------------------------------------------------------------------
export const ConflictSymbol    = Symbol('ConflictSymbol')


export enum ConflictResolutionResult {
    Cancel      = 'Cancel',
    Resume      = 'Resume'
}

//---------------------------------------------------------------------------------------------------------------------
export class ConflictEffect extends Effect {
    handler             : symbol    = ConflictSymbol

    @prototypeValue(false)
    sync                : boolean

    description         : string

    resolutions         : ConflictResolution[]
}


//---------------------------------------------------------------------------------------------------------------------
export class ConflictResolution extends Base {

    getDescription () : string {
        throw new Error('Abstract method')
    }

    resolve () {
        throw new Error('Abstract method')
    }
}
