import React, { useState } from 'react';

import { TMessageSceneList } from '@/shared/types/obs-scene';
import { Window } from '@/client/widgets/window';
import { useSubscription } from '@/client/helpers/use-subscription';
import { Scrollable } from '@/client/widgets/scroll';
import { Button } from '@/client/widgets/button';
import { API } from '@/client/api';

export const ObsSceneWindow: React.FC = () => {
	const [scenes, setScenes] = useState<TMessageSceneList>([]);

	useSubscription<TMessageSceneList>('/d/scenes', (err, ret) => {
		if (err) {
			return console.error(err);
		}
		setScenes(ret);
	});

	return (
		<div className="obs-scenes">
			<Window title="OBS Scenes" type="purple">
				<Scrollable>
					{(scenes ?? []).map((scene) => (
						<div key={scene.name}>
							<Button
								onClick={() =>
									API.send('/action/scene/set', { name: scene.name })
								}
							>
								{scene.name}
								{scene.live && <span className="right">Live</span>}
								{!scene.live && scene.next && (
									<span className="right transition-auto">AUTO</span>
								)}
							</Button>
						</div>
					))}
				</Scrollable>
			</Window>
		</div>
	);
};
