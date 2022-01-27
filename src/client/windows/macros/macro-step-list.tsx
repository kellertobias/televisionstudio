import React from 'react';

import { Button } from '@/client/widgets/button';
import { API } from '@/client/api';
import { TMessageMacro, TMacroStep } from '@/shared/types/macro';

import { MacroStep } from './macro-step';

export const MacroStepList: React.FC<{
	maxEntries: number;
	isMasterWindow: boolean;
	macro: TMessageMacro;
}> = ({ macro, maxEntries, isMasterWindow }) => {
	maxEntries = maxEntries ?? 8;
	const steps = macro.next?.slice(0, maxEntries);
	const hasEnded = macro.currentIndex === macro.total && !macro.run;

	if (macro.total === 0) {
		return (
			<div className="macro-ended">
				<p>Empty</p>
				<p>
					There are no steps in this macro. Add steps in the configuration file.
				</p>
			</div>
		);
	}

	return (
		<>
			{(steps ?? []).map((step) => {
				if (!step) {
					return null;
				}
				return (
					<MacroStep
						key={`step-${step.iteration}-${step.index ?? 0}`}
						step={step as TMacroStep}
						isNextIteration={step?.iteration > 0}
						isMasterWindow={isMasterWindow}
					/>
				);
			})}
			{(steps ?? []).length < maxEntries && (
				<div className="macro-ended">
					{hasEnded
						? 'Macro has ended'
						: // eslint-disable-next-line unicorn/no-nested-ternary
						macro.loop
						? 'Restarts here'
						: 'Last Step'}
				</div>
			)}
			{hasEnded && !macro.loop && (
				<div className="macro-ended">
					<Button
						onClick={() =>
							API.send('/action/macros/reset', { exec: macro?.exec[1] })
						}
					>
						Reset
					</Button>
				</div>
			)}
		</>
	);
};
