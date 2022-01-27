import { useEffect } from 'react';

export const useInterval = (interval: number, cb: () => void): void => {
	return useEffect(() => {
		const intervalPtr = setInterval(cb, interval);

		return () => {
			clearInterval(intervalPtr);
		};
	});
};
