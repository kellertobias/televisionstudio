export type TRequest =
	| {
			t: 'method';
			m: string;
			i: string;
			d: unknown;
	  }
	| {
			t: 'ping';
	  };

export type TResponse =
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

export type TMessageType = 'method' | 'publish' | 'response' | 'pong' | 'ping';
