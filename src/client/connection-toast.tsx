import React, { useEffect, useState } from 'react';

import { TStatusMessage } from '@/shared/api-types/status';
import { sleep } from '@/shared/helpers';
import { API } from '@/client/model/api';
import { Toast } from '@/client/widgets/toast';

const defaultMessage: TStatusMessage = {
	message: `Loaded. Display Size: ${window.innerWidth}x${window.innerHeight}`,
	type: 'green',
};

export const ConnectionToast: React.FC = () => {
	const [message, setMessage] = useState<TStatusMessage | null>(defaultMessage);
	const [atemConnected, setAtemConnected] = useState<boolean>();
	const [serverConnected, setServerConnected] = useState<boolean>();

	useEffect(() => {
		API.onStatus((connected) => {
			setServerConnected(connected);
		});
		setTimeout(() => {
			if (message === defaultMessage) {
				setMessage(null);
			}
		}, 2500);

		const stopMessageSub = API.subscribe<TStatusMessage>(
			'/d/message',
			async (err, ret) => {
				if (err) {
					return console.error(err);
				}

				if (Math.abs(new Date(ret.date).getTime() - Date.now()) < 2500) {
					setMessage(ret);
					await sleep(2900);
					setMessage(null);
				}
			},
		);

		const stopConnectionUpdate = API.subscribe<{ atem: boolean }>(
			'/d/module-connection',
			(err, ret) => {
				console.log(ret);
				setAtemConnected(ret.atem);
			},
		);

		return () => {
			stopMessageSub();
			stopConnectionUpdate();
		};
	});

	if (message?.message && !message?.type?.startsWith('banner')) {
		return (
			<Toast toast type={message.type}>
				{message.message}
			</Toast>
		);
	}

	if (!serverConnected) {
		return (
			<Toast banner type="red" icon={['fas', 'exclamation-circle']}>
				Server not Connected
			</Toast>
		);
	}

	// @TODO Re-Enable
	if (!atemConnected && false) {
		return (
			<Toast banner type="red" icon={['fas', 'exclamation-circle']}>
				Connection to ATEM lost...
			</Toast>
		);
	}

	if (message?.message) {
		return (
			<Toast
				banner
				type={message?.type ?? 'yellow'}
				icon={['fas', 'exclamation-circle']}
			>
				{message.message}
			</Toast>
		);
	}
	return null;
};
