import React from 'react';

import { Modal } from '../widgets/modal';

export const AudioModal: React.FC = () => {
	return (
		<Modal title="Audio - Levels and Routing" type="blue">
			Show one fader per Input Channel, Mix Master, Buttons to choose mix to
			change (Input, Venue Mix, Live Mix, IFB Mix, Aux Mix) If in Input: - Show
			Gain Knobs - Show Compressor Threshold - Show EQ Low Cut
		</Modal>
	);
};
