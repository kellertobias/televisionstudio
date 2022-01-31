import { useEffect } from 'react';

export const useInterval = (interval: number, cb: () => void): (() => void) => {
	let intervalPtr: number;
	let hasInterval = false;
	useEffect(() => {
		hasInterval = true;
		intervalPtr = setInterval(cb, interval);

		return () => {
			if (hasInterval) {
				clearInterval(intervalPtr);
			}
			hasInterval = false;
		};
	});

	return () => {
		if (hasInterval) {
			clearInterval(intervalPtr);
		}
	};
};
