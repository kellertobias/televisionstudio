import { WSAPIPath } from '@/shared/generic';

export const apiUrl = `${
	window.location.protocol === 'http:' ? 'ws' : 'wss'
}://${window.location.hostname}:${window.location.port}${WSAPIPath}`;
