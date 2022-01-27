import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Window } from '@/client/widgets/window';
import { useSubscription } from '@/client/helpers/use-subscription';
import { Button } from '@/client/widgets/button';
import { API } from '@/client/api';
import { TMessageMacro, TMessageMacroEmpty } from '@/shared/types/macro';

import { MacroStepList } from './macro-step-list';

const MasterSelectButton: React.FC<{
	toggleMasterSelection: () => void;
	masterSelectionActive: boolean;
}> = ({ toggleMasterSelection, masterSelectionActive }) => (
	<div className="macro-master-buttons">
		<Button onClick={toggleMasterSelection}>
			{masterSelectionActive
				? 'Cancel Selection Mode'
				: 'Select Master Sequence'}
		</Button>
	</div>
);

export const Macro: React.FC<{
	execNumber: number | 'master';
	maxEntries: number;
	masterSelectionActive: boolean;
	isMasterWindow?: boolean;
	selectMaster?: (execNumber: number) => void;
	enableMasterSelection?: (enable: boolean) => void;
}> = ({
	execNumber,
	maxEntries,
	masterSelectionActive,
	isMasterWindow,
	selectMaster,
	enableMasterSelection,
}) => {
	const [macro, setMacro] = useState<TMessageMacro | TMessageMacroEmpty>();

	useSubscription<TMessageMacro | TMessageMacroEmpty>(
		`/d/macros/${execNumber}`,
		(err, ret) => {
			setMacro(ret);
		},
	);

	const onSelectMaster = () => {
		console.log(macro);
		selectMaster?.((macro as TMessageMacro)?.index);
	};

	const toggleMasterSelection = () => {
		enableMasterSelection?.(!masterSelectionActive);
	};

	const onWindowClick = () => {
		if (masterSelectionActive && isMasterWindow) {
			toggleMasterSelection();
			return;
		}
		if (masterSelectionActive && isMasterWindow !== true) {
			onSelectMaster();
			return;
		}
		API.send('/action/macros/go', { exec: isMasterWindow ? 0 : execNumber });
	};

	const execNumberDisplay = macro?.exec?.join?.('.') ?? execNumber;

	if (macro === undefined && isMasterWindow) {
		return (
			<Window title="Master Macro: Nothing Selected" type="orange">
				<div className="macro-ended">No Master Macro Selected.</div>
				<MasterSelectButton
					toggleMasterSelection={toggleMasterSelection}
					masterSelectionActive={masterSelectionActive}
				/>
			</Window>
		);
	}

	if (macro === undefined || macro.empty) {
		return (
			<div className="macro-list-column" style={{ opacity: 0.4 }}>
				<Window title="Empty Macro" type="orange">
					<div className="macro-list">
						<div className="macro-ended">
							There is no Macro in this Executor
						</div>
						<div className="macro-info">
							{isMasterWindow ? (
								<span className="macro-master">
									Master ({execNumberDisplay})
								</span>
							) : (
								`Exec ${execNumberDisplay}`
							)}
						</div>
					</div>
				</Window>
			</div>
		);
	}

	const windowTitle = (
		<>
			{isMasterWindow
				? `Master Executor: ${(macro as TMessageMacro).name}`
				: (macro as TMessageMacro).name}
			{(macro as TMessageMacro).loop && (
				<FontAwesomeIcon
					icon={['fas', 'sync']}
					style={{ float: 'right', marginTop: 3, opacity: 0.5 }}
				/>
			)}
		</>
	);

	return (
		<div className={isMasterWindow ? 'macros-master' : 'macro-list-column'}>
			<Window title={windowTitle} onClick={onWindowClick} type="orange">
				<div className="macro-list">
					{masterSelectionActive && !isMasterWindow ? (
						<div className="macro-list">
							<Button
								onClick={onSelectMaster}
								style={{ textAlign: 'center', fontSize: 14 }}
							>
								Make Master <br />
								<FontAwesomeIcon
									icon={['fas', 'star']}
									style={{ fontSize: 18 }}
								/>
							</Button>
						</div>
					) : (
						<MacroStepList
							maxEntries={maxEntries ?? 0}
							macro={macro as TMessageMacro}
							isMasterWindow={isMasterWindow}
						/>
					)}
					{isMasterWindow ? (
						<MasterSelectButton
							toggleMasterSelection={toggleMasterSelection}
							masterSelectionActive={masterSelectionActive}
						/>
					) : (
						<div className="macro-info">
							{(macro as TMessageMacro).isMaster ? (
								<span className="macro-master">
									Master ({execNumberDisplay})
								</span>
							) : (
								`Exec ${execNumberDisplay}`
							)}
						</div>
					)}
				</div>
			</Window>
		</div>
	);
};

Macro.defaultProps = {
	isMasterWindow: false,
	selectMaster: () => null,
	enableMasterSelection: () => null,
};
