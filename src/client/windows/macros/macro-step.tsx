import React from 'react';
import clsx from 'clsx';
import moment from 'moment';

import { TMacroStep } from '@/shared/types/macro';

import { MacroTimer } from './macro-timer';

export const MacroStepWrap: React.FC<{
	step: TMacroStep;
	isNextIteration: boolean;
}> = ({ step, isNextIteration, children }) => (
	<div
		className={clsx('macro-step', {
			'macro-step-next-iter': isNextIteration,
			'macro-step-active': step.running,
			'macro-step-triggered': !step.running, // && step.goAt
		})}
	>
		{children}
		<div className="macro-step-foreground">
			<div className="macro-step-title">
				{step.index + 1} {step.name}
			</div>
		</div>
	</div>
);

export const MacroStep: React.FC<{
	step: TMacroStep;
	isNextIteration: boolean;
	isMasterWindow: boolean;
}> = ({ step, isNextIteration, isMasterWindow }) => {
	if (!step) {
		return null;
	}

	if (step.done) {
		return (
			<MacroStepWrap step={step} isNextIteration={isNextIteration}>
				<MacroTimer
					key="macro-step-timer-done"
					done
					{...step}
					isMasterWindow={isMasterWindow}
				/>
			</MacroStepWrap>
		);
	}

	if (step.started) {
		return (
			<MacroStepWrap step={step} isNextIteration={isNextIteration}>
				<MacroTimer
					key="macro-step-timer-started"
					{...step}
					timeBase={moment(step.started).add(step.duration, 'seconds').toDate()}
					change="duration"
					isMasterWindow={isMasterWindow}
				/>
			</MacroStepWrap>
		);
	}

	if (step.triggerAt && typeof step.trigger === 'number') {
		return (
			<MacroStepWrap step={step} isNextIteration={isNextIteration}>
				<MacroTimer
					key="macro-step-timer-trigger"
					{...step}
					timeBase={moment(step.triggerAt).toDate()}
					duration={step.trigger}
					change="trigger"
					isMasterWindow={isMasterWindow}
				/>
			</MacroStepWrap>
		);
	}

	return (
		<MacroStepWrap step={step} isNextIteration={isNextIteration}>
			<MacroTimer
				key="macro-step-timer-default"
				{...step}
				isMasterWindow={isMasterWindow}
			/>
		</MacroStepWrap>
	);
};
