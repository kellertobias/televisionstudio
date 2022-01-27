import React from 'react';

import { TMacroStep, TMessageMacro } from '@/shared/types/macro';

export const MacroStep: React.FC<{
	macro: TMessageMacro;
	step: TMacroStep;
	isNextIteration: boolean;
	isMasterWindow: boolean;
}> = () => null;

// class MacroStep extends React.Component
// 	renderBackground: () ->
// 		step = this.props.step

// 		if step.done
// 			return <MacroTimer
// 				key={"macro-step-timer-done"}
// 				done={true}
// 				stepDuration={step.duration}
// 				stepTrigger={step.trigger}
// 				step={{duration: step.duration, trigger: step.trigger}}
// 				isMasterWindow={this.props.isMasterWindow}
// 			/>

// 		if step.started
// 			return <MacroTimer
// 				key={"macro-step-timer-started"}
// 				timeBase={moment(step.started).add(step.duration, 'seconds').toDate()}
// 				duration={step.duration}
// 				change="duration"
// 				step={{duration: step.duration, trigger: step.trigger}}
// 				isMasterWindow={this.props.isMasterWindow}
// 			/>

// 		if step.triggerAt and typeof step.trigger == 'number'
// 			return <MacroTimer
// 				key={"macro-step-timer-trigger"}
// 				timeBase={moment(step.triggerAt).toDate()}
// 				duration={step.trigger}
// 				change="trigger"
// 				step={{duration: step.duration, trigger: step.trigger}}
// 				isMasterWindow={this.props.isMasterWindow}
// 			/>

// 		return <MacroTimer
// 			key={"macro-step-timer-default"}
// 			step={{duration: step.duration, trigger: step.trigger}}
// 			isMasterWindow={this.props.isMasterWindow}
// 		/>

// 	render: () ->
// 		if not this.props.step
// 			return

// 		step = this.props.step

// 		return <div
// 			className={[
// 				"macro-step"
// 				if this.props.isNextIteration then 'macro-step-next-iter' else ''
// 				if step.running then 'macro-step-active' else ''
// 				if not step.running and step.goAt then 'macro-step-triggered' else ''
// 			].join(' ')}
// 			key={step.index}
// 		>
// 			{this.renderBackground()}
// 			<div className="macro-step-foreground">
// 				<div className="macro-step-title">{step.index + 1} {step.name}</div>
// 			</div>
// 		</div>
