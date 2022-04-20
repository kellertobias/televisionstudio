import React, { useEffect, useState } from 'react';

import { API } from '@/client/api';
import { Toast } from '@/client/widgets/toast';
import { sleep } from '@/shared/helpers';
import { TStatusMessage } from '@/shared/types/status';

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
				setAtemConnected(ret.atem);
			},
		);

		return () => {
			stopMessageSub();
			stopConnectionUpdate();
		};
	});

	const onClose = () => {
		console.log('Nulling Message');
		setMessage(null);
	};

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

	if (!atemConnected) {
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
				onClose={onClose}
			>
				{message.message}
			</Toast>
		);
	}
	return null;
};
