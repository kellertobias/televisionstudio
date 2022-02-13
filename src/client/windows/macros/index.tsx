import React, { useState } from 'react';

import { API } from '@/client/api';

import { Macro } from './macro';

const execNumbers = [...new Array(8)].map((x, i) => i + 1);

export const MacroWindows: React.FC = () => {
	const [masterSelect, setMasterSelect] = useState(false);
	return (
		<>
			<div className="macros-list">
				{execNumbers.map((index) => (
					<Macro
						key={index}
						execNumber={index}
						maxEntries={3}
						masterSelectionActive={masterSelect}
						selectMaster={(currentIndex) => {
							setMasterSelect(false);
							console.log('Making Macro Master:', currentIndex);
							API.send('/action/macros/master', { macroIndex: currentIndex });
						}}
					/>
				))}
			</div>
			<Macro
				execNumber="master"
				maxEntries={8}
				isMasterWindow
				masterSelectionActive={masterSelect}
				enableMasterSelection={(enable) => setMasterSelect(enable)}
			/>
		</>
	);
};
