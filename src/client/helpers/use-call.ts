import { useEffect } from 'react';

import { API, CallParams } from '@/client/api';

export const useCall = <T>(
	endpoint: string,
	parameters: CallParams,
	cb: (err: unknown | null, ret: T) => void,
	triggers?: unknown[],
): void => {
	let noUpdate = false;
	useEffect(() => {
		console.log('Call');
		API.call<T>(endpoint, parameters, (err, ret) => {
			if (noUpdate) {
				return;
			}
			cb(err, ret);
		});

		return () => {
			noUpdate = true;
		};
	}, triggers ?? []);
};
