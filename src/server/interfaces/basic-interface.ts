import { ConfigBackend } from "../engine/config";
import { MacroEngine } from "../engine/macros";
import { Observable } from "../helpers/observable";
import { iModules } from "../modules";

export abstract class BasicInterface extends Observable {
    modules: iModules
    macros: MacroEngine

    constructor(config: ConfigBackend, modules: iModules, macros: MacroEngine) {
        super()
        this.modules = modules
        this.macros = macros
    }

    abstract connect() : Promise<void>
    abstract shutdown() : Promise<void>
    abstract setup() : Promise<void>
}