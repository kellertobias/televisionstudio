import {Engine} from '/server/backend/engine'

console.log("STARTING =====================")
const engine = new Engine()
engine.start()

process.on("SIGTERM", () => {
    engine.stop()
    console.log("STOPPED =====================")
})
