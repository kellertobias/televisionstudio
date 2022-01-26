import { WSAPIPort } from '@/shared/generic';

export const apiUrl = `${
	window.location.protocol === 'http' ? 'ws' : 'wss'
}://${window.location.hostname}:${WSAPIPort}`;
