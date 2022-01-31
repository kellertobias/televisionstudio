import React from 'react';
import { useHistory } from 'react-router-dom';

import { Window } from '@/client/widgets/window';
// import { useSubscription } from '@/client/helpers/use-subscription';
import { Button } from '@/client/widgets/button';
import { BarGraph } from '@/client/widgets/bargraph';
// import { API } from '@/client/api';

export const AudioLevelWindow: React.FC = () => {
	const history = useHistory();
	return (
		<div className="audio-section">
			<Window
				title="Audio"
				type="blue"
				padded
				disabled="Module Disabled"
				onClick={() => {
					history.push('/desk/audio');
				}}
			>
				<div className="audio-window">
					<div className="audio-meters">
						<div className="meter-group">
							<div className="meter-group-content">
								<BarGraph title="L" vertical value={100} width={5} />
								<BarGraph title="R" vertical value={100} width={5} />
								<BarGraph title="1" vertical value={100} width={5} />
								<BarGraph title="2" vertical value={100} width={5} />
								<BarGraph title="3" vertical value={100} width={5} />
								<BarGraph title="4" vertical value={100} width={5} />
								<BarGraph title="5" vertical value={100} width={5} />
								<BarGraph title="5" vertical value={100} width={5} />
								<BarGraph title="7" vertical value={100} width={5} />
								<BarGraph title="8" vertical value={100} width={5} />
							</div>
							<div className="meter-group-title">Inputs</div>
						</div>
						<div className="meter-group">
							<div className="meter-group-content">
								<BarGraph title="L" vertical value={100} width={10} />
								<BarGraph title="R" vertical value={100} width={10} />
							</div>
							<div className="meter-group-title">Master</div>
						</div>
					</div>
					<div className="audio-settings">
						<div className="desk-button-main-row">
							<Button windowMainButton>Set Levels</Button>
						</div>
					</div>
				</div>
			</Window>
		</div>
	);
};
