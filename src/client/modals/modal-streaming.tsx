import React from 'react';

import { Modal } from '../widgets/modal';

export const StreamSetupModal: React.FC = () => {
	return (
		<Modal title="Set Stream Target" type="pink">
			Start Stream or Recording
			<br />
			Change Stream Target
			<br />
			Change Recording Drive (Only Drives, no Folders)
			<br />
			Later: Button to see existing recordings and delete them
		</Modal>
	);
};
