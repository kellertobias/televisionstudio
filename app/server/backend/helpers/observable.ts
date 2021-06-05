export abstract class Observable {
    protected handlers : {
        [key: string]: ((args: object) => void)[]
    } = {}

    registerEventHandler(eventName : string, handler: (...args: any[]) => void) {
        if(!this.handlers[eventName]) this.handlers[eventName] = []
        this.handlers[eventName].push(handler)
    }
    runEventHandlers(eventName : string, args: object) {
        if(!this.handlers[eventName]) return
        this.handlers[eventName].forEach(handler => {
            handler(args);
        });
    }
    onError(handler: ((errorString: string) => void)) {
        this.registerEventHandler('module-error', handler)
    }
    raiseError(errorString: string) {
        this.runEventHandlers('module-error', [errorString])
    }
}