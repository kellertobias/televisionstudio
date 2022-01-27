import { useEffect } from 'react';

import { API } from '@/client/api';

export const useSubscription = <T>(
	endpoint: string,
	cb: (err: unknown | null, ret: T) => void,
	triggers?: unknown[],
): void => {
	useEffect(() => {
		console.log('Resubscribe');
		const stopSubscription = API.subscribe<T>(endpoint, cb);

		return () => {
			stopSubscription();
		};
	}, triggers ?? []);
};
