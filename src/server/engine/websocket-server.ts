import { Express } from 'express';
import { nanoid } from 'nanoid';
import wrapExpressWs from 'express-ws';
import { WebSocket } from 'ws';

import { TRequest, TResponse } from '@/shared/api-types/message';

type TMethod = (params: unknown) => Promise<unknown> | void;

type AugmentedConnection = {
	sendMessage: (data: unknown) => void;
};

type TOnConnectionCallback = (connection: AugmentedConnection) => void;
export class MicroWebsocketServer {
	private app: Express;

	protected connections: { [key: string]: AugmentedConnection } = {};
	protected onConnectionCallbacks: TOnConnectionCallback[] = [];
	protected methodStore: { [key: string]: TMethod } = {};
	protected dataStore: { [key: string]: unknown } = {};

	constructor(app: Express) {
		this.app = app;
		console.log(`Creating Websocket Server on top of API Server`);
	}

	public start(): void {
		console.log('Starting Server');
		const appWs = wrapExpressWs(this.app);
		appWs.app.ws('/socket', (ws, req) => {
			console.log('WS', req);
			this.handleRequest(ws);
		});

		this.onConnection((conn: AugmentedConnection) => {
			Object.keys(this.dataStore).forEach((endpoint: string) => {
				this.singleTempPublish(conn, endpoint, this.dataStore[endpoint]);
			});
		});
	}

	public stop(): void {
		console.log('[WS] Stopped Websockets Server');

		this.methodStore = {};
		this.dataStore = {};
		this.connections = {};
	}

	private async handleRequest(request: WebSocket) {
		console.log('New Websocket Client Connected');
		const id: string = nanoid();

		const conn = {
			sendMessage: (msg: TResponse) => {
				request.send(JSON.stringify(msg));
			},
		};

		this.connections[id] = conn;

		request.on('message', async (rawMessage) => {
			const strMessage = rawMessage.toString();
			console.log(strMessage);
			const message = JSON.parse(strMessage);
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
		request.on('close', () => {
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
