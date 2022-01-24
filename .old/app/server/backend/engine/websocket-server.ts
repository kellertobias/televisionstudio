import http from '../../http'
import {nanoid} from 'nanoid'
import {request as Request, connection as Connection, server as WebSocketServer} from 'websocket'

type tMethod = (params: any) => Promise<any> | void
type tRequest = {
    t: 'method',
    m: string,
    i: string,
    d: any
} | {
    t: 'ping'
}

type tResponse = {
    t: 'publish' | 'response',
    i?: string,
    m: string,
    d?: any,
    e?: string
} | {
    t: 'pong'
}

type AugmentedConnection = Connection & {
    sendMessage: (msg: tResponse) => void
}


type tOnConnectionCallback = (connection: AugmentedConnection) => void
export class MicroWebsocketServer {
    public port: number
    protected server : WebSocketServer | undefined
    protected httpServer : http.Server

    protected connections : {[key: string]: AugmentedConnection} = {}
    protected onConnectionCallbacks : tOnConnectionCallback[] = []
    protected methodStore : {[key: string]: tMethod} = {}
    protected dataStore : {[key: string]: any} = {}

    constructor(port: number) {
        this.port = port
        console.log("Websocket Server Started")

        this.httpServer = http.createServer();
    }

    start() {
        console.log("Starting Server")
        this.httpServer.listen(this.port);
        this.server = new WebSocketServer({httpServer: this.httpServer});
        this.server.on('request', (request) => this._handleRequest(request));

        this.onConnection((conn: AugmentedConnection) => {
            Object.keys(this.dataStore).forEach((endpoint : string) => {
                this.singleTempPublish(conn, endpoint, this.dataStore[endpoint])
            })
    
            return
        })
    }

    stop() {
        console.log('[WS] Stopped Websockets Server')

        if(!this.server) {
            console.log("Websocket Server did not run")
        } else {
            this.server.closeAllConnections()
        }

        this.methodStore = {}
        this.dataStore = {}
        this.connections = {}
        
        this.httpServer.close()
        return
    }

    _handleRequest(request: Request) {
        console.log("New Websocket Client Connected")
        const connection = request.accept(undefined, request.origin);
        const id : string = nanoid()
        const conn : AugmentedConnection = <AugmentedConnection>connection
    
        conn.sendMessage = (msg : tResponse) => {
            connection.sendUTF(JSON.stringify(msg));
        }

        this.connections[id] = conn
    
    
        connection.on('message', (message) => {
            if(!message.utf8Data) {
                console.log("Websocket Message was empty")
                return
            }
    
            try {
                const data = JSON.parse(message.utf8Data) as tRequest
                if(data.t == 'method') {
                    const method : tMethod = this.methodStore[data.m]
                    if(!method) {
                        console.error("no such method: " + data.m)
                        return
                    }

                    console.log(`[WEBAPI] Running Method ${data.m} with data: `, data.d);

                    try {
                        (method(data.d || {}) || Promise.resolve()).then((res: any) => {
                            conn.sendMessage({
                                    t: 'response',
                                    i: data.i,
                                    m: data.m,
                                    d: res
                            })
                        }).catch((err: Error) => {
                            const error = String(err)
                            conn.sendMessage({
                                t: 'response',
                                i: data.i,
                                m: data.m,
                                e: error
                            })
                        })
                    } catch (err) {
                        console.error(`[WEBAPI] Error when executing Method${data.m}:`, err)
                        const error = String(err)
                        conn.sendMessage({
                            t: 'response',
                            i: data.i,
                            m: data.m,
                            e: error
                        })
                    }
                } else if(data.t == 'ping') {
                    conn.sendMessage({
                        t: 'pong'
                    })
                } else {
                    // Kind of hackish, but best solution to find wrong API usage
                    const unknownType = (data as {t: string}).t as string
                    console.log(`[WEBAPI] Call Type Unknown ${unknownType}`);
                }
            } catch (error) {
                console.log("Websocket Message was no JSON:", message.utf8Data)
            }
        });
        connection.on('close', (_reasonCode, _description) => {
            console.log('Client has disconnected.');
            delete this.connections[id]
        });
        this.onConnectionCallbacks.forEach(cb => {
            cb(conn)
        })
    }

    singleTempPublish(conn: AugmentedConnection, endpoint: string, data: any) {
        conn.sendMessage({
            t: 'publish',
            m: endpoint,
            d: data
        })
    }

    tempPublish(endpoint: string, data: any) {
        Object.values(this.connections).forEach(conn => {
            this.singleTempPublish(conn, endpoint, data)
        });
    }

    publish(endpoint: string, data: any) {
        this.dataStore[endpoint] = data
        this.tempPublish(endpoint, data)

        return {
            end: () => {
                delete this.dataStore[endpoint]
            }
        }
    }

    unpublish(endpoint: string) {
        delete this.dataStore[endpoint]
    }

    onConnection = (fn: tOnConnectionCallback) => {
        this.onConnectionCallbacks.push(fn)
    }

    _registerMethods(endpoint : string, method: tMethod) {
        if(this.methodStore[endpoint]) {
            console.error("Method Already Defined for " + endpoint)
            throw new Error("Method "+endpoint+" Already Defined")
        }
        this.methodStore[endpoint] = method
    }

    methods(methods: {
        [endpoint: string]: tMethod
    }){
        Object.keys(methods).forEach((endpoint: string) => {
            const method = methods[endpoint];
            this._registerMethods(endpoint, method)
        })
    }
}
