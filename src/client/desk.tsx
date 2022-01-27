import React from 'react';

import './style/index.scss';

import './api';
import { ConnectionToast } from './connection-toast';
import { TimeWindow } from './windows/time';
import { ShowInfoWindow } from './windows/show';
import { StatusWindow } from './windows/status';
import { StreamWindow } from './windows/stream';
import { VideoNormWindow } from './windows/norm';
import { RateWindow } from './windows/rate';
import { TransitionWindow } from './windows/transition';
import { ObsSceneWindow } from './windows/obs-scene';
import { AudioLevelWindow } from './windows/audio';
import { MacroWindows } from './windows/macros';

export const DeskGUI: React.FC = () => (
	<div className="desk-body">
		<div className="desk">
			<div className="frame">
				{/* <Modal /> */}
				<MacroWindows />
				<AudioLevelWindow />
				<ObsSceneWindow />
				<TransitionWindow />
				<RateWindow />
				<VideoNormWindow />
				<StreamWindow />
				<StatusWindow />
				<ShowInfoWindow />
				<TimeWindow />
				<ConnectionToast />
			</div>
		</div>
	</div>
);
