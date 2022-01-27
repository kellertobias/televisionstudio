import React, { useState } from 'react';

import { Window } from '@/client/widgets/window';
import { useSubscription } from '@/client/helpers/use-subscription';

export const VideoNormWindow: React.FC = () => {
	const [videoNorm, setVideoNorm] = useState<{
		size: string;
		fps: number;
	} | null>();

	useSubscription<{ atem: { size: string; fps: number } }>(
		'/d/global',
		(err, ret) => {
			if (err) {
				return console.error(err);
			}
			setVideoNorm(ret?.atem);
		},
	);

	return (
		<div className="state-video-norm">
			<Window type="pink" title="Video Norm" compact padded>
				{videoNorm?.size ?? '???'}@{Number(videoNorm?.fps).toFixed(2)}
			</Window>
		</div>
	);
};
