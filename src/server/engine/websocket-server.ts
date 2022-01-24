import http from 'http';

import { nanoid } from 'nanoid';
import {
	request as Request,
	connection as Connection,
	server as WebSocketServer,
} from 'websocket';

type TMethod = (params: unknown) => Promise<unknown> | void;
type TRequest =
	| {
			t: 'method';
			m: string;
			i: string;
			d: unknown;
	  }
	| {
			t: 'ping';
	  };

type TResponse =
	| {
			t: 'publish' | 'response';
			i?: string;
			m: string;
			d?: unknown;
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
	protected dataStore: { [key: string]: unknown } = {};

	constructor(port: number) {
		this.port = port;
		console.log('Websocket Server Started');

		this.httpServer = http.createServer();
	}

	public start(): void {
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

	public stop(): void {
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

	private async handleRequest(request: Request) {
		console.log('New Websocket Client Connected');
		const connection = request.accept(undefined, request.origin);
		const id: string = nanoid();
		const conn: AugmentedConnection = <AugmentedConnection>connection;

		conn.sendMessage = (msg: TResponse) => {
			connection.sendUTF(JSON.stringify(msg));
		};

		this.connections[id] = conn;

		connection.on('message', async (message) => {
			if (!(message as { utf8Data: string }).utf8Data) {
				console.log('Websocket Message was empty');
				return;
			}

			try {
				const data = JSON.parse(
					(message as { utf8Data: string }).utf8Data,
				) as TRequest;
				if (data.t === 'method') {
					const method: TMethod = this.methodStore[data.m];
					if (!method) {
						console.error(`no such method: ${data.m}`);
						return;
					}

					console.log(`[WEBAPI] Running Method ${data.m} with data:`, data.d);

					try {
						try {
							const methodResponse = await method(data.d || {});

							conn.sendMessage({
								t: 'response',
								i: data.i,
								m: data.m,
								d: methodResponse,
							});
						} catch (error_: unknown) {
							const error = String(error_);
							conn.sendMessage({
								t: 'response',
								i: data.i,
								m: data.m,
								e: error,
							});
						}
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
				} else if (data.t === 'ping') {
					conn.sendMessage({
						t: 'pong',
					});
				} else {
					// Kind of hackish, but best solution to find wrong API usage
					const unknownType = (data as { t: string }).t as string;
					console.log(`[WEBAPI] Call Type Unknown ${unknownType}`);
				}
			} catch {
				console.log(
					'Websocket Message was no JSON:',
					(message as { utf8Data: string }).utf8Data,
				);
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

	private singleTempPublish(
		conn: AugmentedConnection,
		endpoint: string,
		data: unknown,
	) {
		conn.sendMessage({
			t: 'publish',
			m: endpoint,
			d: data,
		});
	}

	private tempPublish(endpoint: string, data: unknown) {
		Object.values(this.connections).forEach((conn) => {
			this.singleTempPublish(conn, endpoint, data);
		});
	}

	public publish(endpoint: string, data: unknown): { end: () => void } {
		this.dataStore[endpoint] = data;
		this.tempPublish(endpoint, data);

		return {
			end: () => {
				delete this.dataStore[endpoint];
			},
		};
	}

	public unpublish(endpoint: string): void {
		delete this.dataStore[endpoint];
	}

	public onConnection = (fn: TOnConnectionCallback): void => {
		this.onConnectionCallbacks.push(fn);
	};

	private registerMethods(endpoint: string, method: TMethod) {
		if (this.methodStore[endpoint]) {
			console.error(`Method Already Defined for ${endpoint}`);
			throw new Error(`Method ${endpoint} Already Defined`);
		}
		this.methodStore[endpoint] = method;
	}

	public methods(methods: { [endpoint: string]: TMethod }): void {
		Object.keys(methods).forEach((endpoint: string) => {
			const method = methods[endpoint];
			this.registerMethods(endpoint, method);
		});
	}
}
