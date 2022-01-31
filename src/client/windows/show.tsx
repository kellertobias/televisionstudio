import React from 'react';
import { useHistory } from 'react-router-dom';

import { Window } from '@/client/widgets/window';
import { Button } from '@/client/widgets/button';

export const ShowInfoWindow: React.FC = () => {
	const history = useHistory();
	return (
		<div className="tabs-section">
			<Window>
				<div className="desk-button-secondary">
					<Button
						onClick={() => true}
						style={{ opacity: 0.5 }}
						icon={['fas', 'edit']}
					/>
					<Button
						onClick={() => history.push('/desk/shows')}
						icon={['fas', 'folder-open']}
					/>
					<Button
						onClick={() => history.push('/desk/settings')}
						icon={['fas', 'tools']}
					/>
				</div>
			</Window>
		</div>
	);
};
