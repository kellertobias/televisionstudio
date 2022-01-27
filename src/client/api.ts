import { nanoid } from 'nanoid';

import { apiUrl } from '@/client/constants';
import { TMessageType, TResponse } from '@/shared/types/message';

export type SubscriptionHandler<T> = (error: unknown, message: T) => void;
export type ConnectedCallback = (connected: boolean) => void;
export type CallCallback<T> = (error: unknown, message: T) => void;
export type CallParams = string | number | boolean | Record<string, unknown>;

class APIConnection {
	public connected = false;
	public connecting = false;

	private url: string;

	private ws: WebSocket | null = null;
	private endpointHandlers: Record<
		string,
		Record<string, SubscriptionHandler<unknown>>
	> = {};
	private methodCallbacks = {};
	private callbacks = {};
	private interval = null;
	private connectionHandlers: ConnectedCallback[] = [];
	private initialSources: Record<string, unknown> = {};

	constructor(url: string) {
		this.url = url;

		this.connect();
	}

	private onError = () => {
		console.log('Websocket Open');
		this.connected = true;
		this.connecting = false;
		(this.connectionHandlers || []).forEach((handler) => {
			handler(true);
		});
	};

	private onOpen = () => {
		console.log('Websocket Open');
		this.connected = true;
		this.connecting = false;
		(this.connectionHandlers || []).forEach((handler) => {
			handler(true);
		});
	};

	private onClose = (e: unknown) => {
		this.connected = false;
		this.connecting = false;
		console.log(
			'Socket is closed. Reconnect will be connecting in 1 second.',
			(e as { reason: string })?.reason,
		);
		(this.connectionHandlers || []).forEach((handler) => {
			handler(false);
		});
		if (this.interval == null) {
			clearInterval(this.interval);
		}

		this.interval = setInterval(() => {
			if (!this.connected && !this.connecting) {
				this.connect();
			}
		}, 1000);
	};

	private connect() {
		console.log('Trying to open Websocket');
		this.connecting = true;
		this.ws = new WebSocket(this.url);
		this.ws.addEventListener('error', this.onError);
		this.ws.addEventListener('open', this.onOpen);
		this.ws.addEventListener('close', this.onClose);
		this.ws.addEventListener('message', this.onMessage);
	}

	private onMessage = (event: WebSocketEventMap['message']) => {
		try {
			const msg = JSON.parse(event.data) as TResponse;

			if (msg.t === 'pong') {
				return;
			}

			const endpoint = [msg.m, msg.i].filter((x) => x !== undefined).join('/');
			const handlers = Object.values(this.endpointHandlers[endpoint] ?? {});
			handlers.forEach((handler) => {
				handler(msg.e, msg.d);
			});

			if (handlers.length === 0) {
				console.log(`[API] ${msg.m} - ${msg.i ?? msg.t}`, msg.d);
			}

			if (msg.t === 'publish') {
				this.initialSources[msg.m] = msg.d;
			}
		} catch (error) {
			console.log(`[API] Error`, error);
		}
	};

	public send(
		method: string,
		data: unknown,
		options?: { id?: string; type?: TMessageType },
	) {
		let { id, type } = options ?? {};
		id = id ?? nanoid();
		type = type ?? 'method';

		this.ws.send(
			JSON.stringify({
				t: type,
				m: method,
				i: id,
				d: data,
			}),
		);
	}

	public call<T>(
		method: string,
		data: CallParams,
		callback: CallCallback<T>,
	): void;
	public call<T>(method: string, callback: CallCallback<T>): void;
	public call<T>(method: string, data: CallParams): Promise<T>;
	public call<T>(method: string): Promise<T>;
	call<T>(
		method: string,
		second?: CallParams | CallCallback<T>,
		third?: CallCallback<T>,
	) {
		const callback: CallCallback<T> =
			typeof second === 'function' ? second : third;
		const params = typeof second !== 'function' ? second : {};

		const prm = new Promise<T>((resolve, reject) => {
			const id = nanoid();
			this.send(method, params, { id });
			const destroyHandler = this.subscribe(
				`${method}/${id}`,
				(error, response) => {
					destroyHandler();
					if (error) {
						return reject(error);
					}
					return resolve(response as T);
				},
			);
		});

		if (!callback) {
			return prm;
		}

		prm
			.then((response) => {
				// eslint-disable-next-line promise/no-callback-in-promise
				callback(null, response);
				return response;
			})
			.catch((error) => {
				// eslint-disable-next-line promise/no-callback-in-promise
				callback(error, null);
			});
	}

	public subscribe<T>(
		endpoint: string,
		handler: SubscriptionHandler<T>,
	): () => void {
		const id = nanoid();
		if (typeof this.endpointHandlers[endpoint] !== 'object') {
			this.endpointHandlers[endpoint] = {};
		}
		this.endpointHandlers[endpoint][id] = handler;
		if (this.initialSources[endpoint] !== undefined) {
			handler(null, this.initialSources[endpoint] as T);
		}

		return () => {
			delete this.endpointHandlers[endpoint][id];
		};
	}

	public onStatus(handler: ConnectedCallback) {
		this.connectionHandlers.push(handler);
		if (this.connected) {
			handler(true);
		}
	}
}

export const API = new APIConnection(apiUrl);

// For debugging purposes
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.api = API;
