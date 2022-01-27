import React, { useState } from 'react';

import { Window } from '@/client/widgets/window';
import { useSubscription } from '@/client/helpers/use-subscription';

export const TransitionWindow: React.FC = () => {
	const [position, setPosition] = useState<number>(50);

	useSubscription<number>('/d/trans-pos', (err, ret) => {
		if (err) {
			return console.error(err);
		}
		setPosition(ret);
	});

	return (
		<div className="transition-bar">
			<Window type="green">
				<div className="transition-state">
					<div
						style={{
							top: 3,
							right: 3,
							bottom: 3,
							left: 3,
							position: 'absolute',
						}}
					>
						<div
							className="transition-state-fill"
							style={{
								borderRadius: 2,
								position: 'absolute',
								bottom: 0,
								left: 0,
								right: 0,
								margin: 0,
								height: `${(position / 10000) * 100}%`,
							}}
						/>
					</div>
				</div>
			</Window>
		</div>
	);
};
