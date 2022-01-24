import http from 'http';

import { nanoid } from 'nanoid';
import {
	request as Request,
	connection as Connection,
	server as WebSocketServer,
} from 'websocket';

type TMethod = (params: any) => Promise<any> | void;
type TRequest =
	| {
			t: 'method';
			m: string;
			i: string;
			d: any;
	  }
	| {
			t: 'ping';
	  };

type TResponse =
	| {
			t: 'publish' | 'response';
			i?: string;
			m: string;
			d?: any;
			e?: string;
	  }
	| {
			t: 'pong';
	  };

type AugmentedConnection = Connection & {
	sendMessage: (msg: TResponse) => void;
};

type TOnConnectionCallback = (connection: AugmentedConnection) => void;
export class MicroWebsocketServer {
	public port: number;
	protected server: WebSocketServer | undefined;
	protected httpServer: http.Server;

	protected connections: { [key: string]: AugmentedConnection } = {};
	protected onConnectionCallbacks: TOnConnectionCallback[] = [];
	protected methodStore: { [key: string]: TMethod } = {};
	protected dataStore: { [key: string]: any } = {};

	constructor(port: number) {
		this.port = port;
		console.log('Websocket Server Started');

		this.httpServer = http.createServer();
	}

	start() {
		console.log('Starting Server');
		this.httpServer.listen(this.port);
		this.server = new WebSocketServer({ httpServer: this.httpServer });
		this.server.on('request', (request) => {
			this.handleRequest(request);
		});

		this.onConnection((conn: AugmentedConnection) => {
			Object.keys(this.dataStore).forEach((endpoint: string) => {
				this.singleTempPublish(conn, endpoint, this.dataStore[endpoint]);
			});
		});
	}

	stop() {
		console.log('[WS] Stopped Websockets Server');

		if (!this.server) {
			console.log('Websocket Server did not run');
		} else {
			this.server.closeAllConnections();
		}

		this.methodStore = {};
		this.dataStore = {};
		this.connections = {};

		this.httpServer.close();
	}

	handleRequest(request: Request) {
		console.log('New Websocket Client Connected');
		const connection = request.accept(undefined, request.origin);
		const id: string = nanoid();
		const conn: AugmentedConnection = <AugmentedConnection>connection;

		conn.sendMessage = (msg: TResponse) => {
			connection.sendUTF(JSON.stringify(msg));
		};

		this.connections[id] = conn;

		connection.on('message', (message) => {
			if (!(message as any).utf8Data) {
				console.log('Websocket Message was empty');
				return;
			}

			try {
				const data = JSON.parse((message as any).utf8Data) as TRequest;
				if (data.t === 'method') {
					const method: TMethod = this.methodStore[data.m];
					if (!method) {
						console.error(`no such method: ${data.m}`);
						return;
					}

					console.log(`[WEBAPI] Running Method ${data.m} with data:`, data.d);

					try {
						(method(data.d || {}) || Promise.resolve())
							.then((res: any) => {
								conn.sendMessage({
									t: 'response',
									i: data.i,
									m: data.m,
									d: res,
								});
								return res;
							})
							.catch((error_: Error) => {
								const error = String(error_);
								conn.sendMessage({
									t: 'response',
									i: data.i,
									m: data.m,
									e: error,
								});
							});
					} catch (error_) {
						console.error(
							`[WEBAPI] Error when executing Method${data.m}:`,
							error_,
						);
						const error = String(error_);
						conn.sendMessage({
							t: 'response',
							i: data.i,
							m: data.m,
							e: error,
						});
					}
				} else if (data.t == 'ping') {
					conn.sendMessage({
						t: 'pong',
					});
				} else {
					// Kind of hackish, but best solution to find wrong API usage
					const unknownType = (data as { t: string }).t as string;
					console.log(`[WEBAPI] Call Type Unknown ${unknownType}`);
				}
			} catch {
				console.log('Websocket Message was no JSON:', message.utf8Data);
			}
		});
		connection.on('close', () => {
			console.log('Client has disconnected.');
			delete this.connections[id];
		});
		this.onConnectionCallbacks.forEach((cb) => {
			cb(conn);
		});
	}

	singleTempPublish(conn: AugmentedConnection, endpoint: string, data: any) {
		conn.sendMessage({
			t: 'publish',
			m: endpoint,
			d: data,
		});
	}

	tempPublish(endpoint: string, data: any) {
		Object.values(this.connections).forEach((conn) => {
			this.singleTempPublish(conn, endpoint, data);
		});
	}

	publish(endpoint: string, data: any) {
		this.dataStore[endpoint] = data;
		this.tempPublish(endpoint, data);

		return {
			end: () => {
				delete this.dataStore[endpoint];
			},
		};
	}

	unpublish(endpoint: string) {
		delete this.dataStore[endpoint];
	}

	onConnection = (fn: TOnConnectionCallback) => {
		this.onConnectionCallbacks.push(fn);
	};

	registerMethods(endpoint: string, method: TMethod) {
		if (this.methodStore[endpoint]) {
			console.error(`Method Already Defined for ${endpoint}`);
			throw new Error(`Method ${endpoint} Already Defined`);
		}
		this.methodStore[endpoint] = method;
	}

	methods(methods: { [endpoint: string]: TMethod }) {
		Object.keys(methods).forEach((endpoint: string) => {
			const method = methods[endpoint];
			this.registerMethods(endpoint, method);
		});
	}
}
