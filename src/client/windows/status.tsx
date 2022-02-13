import React, { useState } from 'react';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { TServerStatus, TServerName } from '@/shared/types/status';
import { Window } from '@/client/widgets/window';
import { useSubscription } from '@/client/helpers/use-subscription';

type ModuleStateValue = 'error' | 'warn' | 'ok';

const ModuleState: React.FC<{
	name: string;
	state: ModuleStateValue;
	// eslint-disable-next-line react/require-default-props
	reason?: string;
}> = ({ name, state, reason }) => {
	return (
		<div
			className={clsx('module-state', {
				'module-state-error': state === 'error',
				'module-state-warn': state === 'warn',
				'module-state-ok': state === 'ok',
			})}
		>
			<span className="module-state-name">{name}</span>
			{reason && (
				<span className="module-state-reason">
					<span>{reason}</span>
				</span>
			)}
			<span className="module-state-icon">
				{state === 'ok' && <FontAwesomeIcon icon={['far', 'check-circle']} />}
				{state === 'warn' && (
					<FontAwesomeIcon icon={['fas', 'exclamation-triangle']} />
				)}
				{state === 'error' && (
					<FontAwesomeIcon icon={['fas', 'exclamation-circle']} />
				)}
			</span>
		</div>
	);
};

export const StatusWindow: React.FC = () => {
	const [workload, setWorkload] = useState<null | TServerStatus['workload']>();
	const [warnings, setWarnings] = useState<
		Partial<Record<TServerName, string>>
	>({});

	useSubscription<TServerStatus>('/d/usage', (err, ret) => {
		if (err) {
			return console.error(err);
		}
		setWorkload(ret.workload);
		setWarnings(ret.warnings);
	});

	let deskState: ModuleStateValue = 'ok';
	let deskWarning: string | undefined;
	if (workload?.desk?.cpu > 0.1) {
		deskState = 'warn';
		deskWarning = 'CPU';
	}

	if (workload?.desk?.ram > 0.7) {
		deskState = 'warn';
		deskWarning = 'RAM';
	}
	if (workload?.desk?.ram > 0.8) {
		deskState = 'error';
		deskWarning = 'RAM';
	}
	if (warnings?.serial) {
		deskState = 'error';
		deskWarning = 'Serial';
	}

	let obsState: ModuleStateValue = 'ok';
	let obsWarning: string | undefined;
	if (workload?.obs?.cpu > 0.25) {
		obsState = 'warn';
		obsWarning = 'CPU';
	}

	if (workload?.obs?.cpu > 0.33) {
		obsState = 'error';
		obsWarning = 'CPU';
	}

	if (warnings?.obs) {
		obsState = 'error';
		obsWarning = warnings.obs;
	}

	return (
		<div className="state-servers">
			<Window
				type={
					Object.values(warnings).filter((x) => x).length > 0 ? 'red' : 'green'
				}
				title="Device States"
				compact
				padded
			>
				<ModuleState
					name="Control Desk"
					state={deskState}
					reason={deskWarning}
				/>
				<ModuleState
					name="Tally Sender"
					state={!warnings?.tally ? 'ok' : 'error'}
					reason={warnings?.tally}
				/>
				<ModuleState
					name="ATEM Mixer"
					state={!warnings?.atem ? 'ok' : 'error'}
					reason={warnings?.atem}
				/>
				<ModuleState name="OBS Server" state={obsState} reason={obsWarning} />
				{/* <ModuleState
					name="Audio Mixer"
					state={!warnings?.audio ? 'ok' : 'error'}
					reason={warnings?.audio}
				/> */}
				<ModuleState
					name="Text Generator"
					state={!warnings?.text ? 'ok' : 'error'}
					reason={warnings?.text}
				/>
				{/* <ModuleState
					name="Web Presenter"
					state={!warnings?.webpresenter ? 'ok' : 'error'}
					reason={warnings?.webpresenter}
				/>
				<ModuleState
					name="HyperDeck"
					state={!warnings?.hyperdeck ? 'ok' : 'error'}
					reason={warnings?.hyperdeck}
				/> */}
			</Window>
		</div>
	);
};
