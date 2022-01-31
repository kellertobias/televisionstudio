import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { TMessageStream, TMessageRecord } from '@/shared/types/stream';
import { Window } from '@/client/widgets/window';
import { Button } from '@/client/widgets/button';
import { useSubscription } from '@/client/helpers/use-subscription';

export const StreamWindow: React.FC = () => {
	const history = useHistory();
	const [streaming, setStreaming] = useState<null | TMessageStream>();
	const [recording, setRecording] = useState<null | TMessageRecord>();

	useSubscription<TMessageStream>('/d/streaming', (err, ret) => {
		if (err) {
			return console.error(err);
		}
		setStreaming(ret);
	});

	useSubscription<TMessageRecord>('/d/recording', (err, ret) => {
		if (err) {
			return console.error(err);
		}
		setRecording(ret);
	});

	return (
		<div className="state-data">
			<Window
				type="pink"
				title="Stream/ Record"
				compact
				padded
				onClick={() => history.push('/desk/stream')}
			>
				<div className="state-data-segment">
					<h3>Stream</h3>
					{streaming?.status === 'running' ? (
						<div className="state-data-segment-content">
							<div className="state-data-segment-icon">
								<FontAwesomeIcon
									icon={['fas', 'satellite-dish']}
									className="text-danger"
								/>
							</div>
							<div className="state-data-segment-text">
								<span className="state-data-segment-main">
									{streaming?.time?.split('.')[0]}
								</span>
								<br />
								<span className="text-muted">
									{streaming?.bandwidth} kbit/s
								</span>
							</div>
						</div>
					) : (
						<div className="state-data-segment-content">
							<div className="state-data-segment-icon">
								<FontAwesomeIcon
									icon={['fas', 'pause']}
									className="text-muted"
								/>
							</div>
							<div className="state-data-segment-text text-muted">
								Not Active
							</div>
						</div>
					)}
				</div>

				<div className="state-data-segment">
					<h3>Recording</h3>
					{recording?.status === 'running' ? (
						<div className="state-data-segment-content">
							<div className="state-data-segment-icon">
								<FontAwesomeIcon
									icon={['fas', 'circle']}
									className="text-danger"
								/>
							</div>
							<div className="state-data-segment-text">
								<span className="state-data-segment-main">
									{recording.time.split('.')[0]}
								</span>
							</div>
						</div>
					) : (
						<div className="state-data-segment-content">
							<div className="state-data-segment-icon">
								<FontAwesomeIcon
									icon={['fas', 'pause']}
									className="text-muted"
								/>
							</div>
							<div className="state-data-segment-text text-muted">
								Not Recording
							</div>
						</div>
					)}
				</div>

				<div className="desk-button-mini-row">
					<Button icon="cog" />
				</div>
			</Window>
		</div>
	);
};
