import React, { useRef, useState } from 'react';

import { useInterval } from '@/client/helpers/use-interval';

export const MacroTimer: React.FC<{
	done?: boolean;
	duration?: number;
	trigger?: number | 'GO';
	isMasterWindow: boolean;
	timeBase?: Date;
	change?: 'duration' | 'trigger' | '';
}> = ({ done, duration, trigger, isMasterWindow, timeBase, change }) => {
	const [percentage, setPercentage] = useState(done ? 100 : 0);
	const [currentTrigger, setTrigger] = useState<number | undefined | 'GO'>(
		trigger,
	);
	const [currentDuration, setDuration] = useState<number | undefined>(duration);

	const clearUpdate = useRef<() => void>();
	const update = () => {
		if (done) {
			setPercentage(100);
			if (change === 'duration') {
				setDuration(duration);
			}
			if (change === 'trigger') {
				setTrigger(trigger);
			}
			clearUpdate.current?.();
		} else if (timeBase) {
			const elapsed = (timeBase.getTime() - Date.now()) / 1000;

			setPercentage(
				100 - Math.min(100, Math.max(0, (elapsed / duration) * 100)),
			);
			if (change === 'duration') {
				setDuration(Math.max(0, elapsed));
			}
			if (change === 'trigger') {
				setTrigger(Math.max(0, elapsed));
			}
		}
	};

	clearUpdate.current = useInterval(100, update);

	const printTrigger = () => {
		if (done) {
			return '-';
		}

		if (trigger === 'GO' || trigger === undefined || trigger === 0) {
			return 'GO';
		}

		if (currentTrigger === 0) {
			return 'RUN';
		}

		return `${Number(currentTrigger ?? trigger).toFixed(1)}s`;
	};

	const printDuration = () => {
		if (done) {
			return 'DONE';
		}

		if (!duration) {
			return '0s';
		}

		return `${Number(currentDuration).toFixed(1)}s`;
	};

	const printCombined = () => {
		if (done) {
			return 'DONE';
		}

		if (change === 'duration') {
			return `${Number(duration).toFixed(1)}s`;
		}

		if (trigger === 'GO' || trigger === undefined) {
			return 'GO';
		}

		return `${Number(trigger).toFixed(1)}s`;
	};

	return (
		<>
			<div className="macro-step-background">
				<div
					className="macro-step-background-fill"
					style={{
						background: change === 'trigger' ? '#BB8800' : '#005500',
						position: 'absolute',
						left: 0,
						top: 0,
						bottom: 0,
						width: `${done ? 100 : percentage}%`,
					}}
				/>
			</div>
			<div
				className="macro-step-info"
				style={{
					position: 'absolute',
					zIndex: 10,
					top: 0,
					bottom: 0,
					right: 0,
				}}
			>
				{isMasterWindow ? (
					<>
						<div
							style={{
								position: 'absolute',
								right: 0,
								top: 0,
								bottom: 0,
								width: 70,
							}}
						/>
						<div
							style={{
								position: 'absolute',
								right: 48,
								lineHeight: '18px',
								top: 3,
							}}
						>
							{printTrigger()}
						</div>
						<div
							style={{
								position: 'absolute',
								right: 42,
								borderRight: '1px solid white',
								height: 18,
								top: 4,
							}}
						/>
						<div
							style={{
								position: 'absolute',
								right: 5,
								textAlign: 'right',
								width: 34,
								lineHeight: '18px',
								top: 3,
							}}
						>
							{printDuration()}
						</div>
					</>
				) : (
					<>
						<div
							style={{
								position: 'absolute',
								right: 0,
								top: 0,
								bottom: 0,
								width: 50,
							}}
						/>
						<div
							style={{
								position: 'absolute',
								right: 5,
								textAlign: 'right',
								width: 34,
								lineHeight: '18px',
								top: 5,
							}}
						>
							{printCombined()}
						</div>
					</>
				)}
			</div>
		</>
	);
};

MacroTimer.defaultProps = {
	done: false,
	duration: undefined,
	trigger: 'GO',
	change: '',
	timeBase: undefined,
};
