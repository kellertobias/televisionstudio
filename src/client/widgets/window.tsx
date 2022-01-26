import React from 'react';
import clsx from 'clsx';

export type WindowType =
	| 'orange'
	| 'purple'
	| 'blue'
	| 'pink'
	| 'red'
	| 'green'
	| 'default';

export const Window: React.FC<{
	type?: WindowType;
	title?: string;
	compact?: boolean;
	padded?: boolean;
	disabled?: string;
	onClick?: (e: React.MouseEvent) => void;
}> = ({ type, title, compact, padded, disabled, onClick, children }) => {
	const onClickHandler = (e: React.MouseEvent) => {
		if (onClick) {
			onClick(e);
		}
	};
	return (
		<div
			className={clsx({
				window: true,
				[`window-${type ?? 'default'}`]: true,
				'window-titled': title !== undefined,
				'window-titled-compact': compact,
				'window-padded': padded,
			})}
			onClick={onClickHandler}
			style={{ opacity: disabled ? 0.3 : 1 }}
		>
			{title ? <div className="window-title">{title}</div> : null}
			<div className="window-content">
				{children}
				{disabled !== undefined ? (
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							bottom: 0,
							top: 0,
							background: 'rgba(0,0,0,0.8)',
							textAlign: 'center',
							color: '#AAA',
							zIndex: 50,
							padding: 10,
							fontSize: 16,
						}}
					>
						{disabled}
					</div>
				) : null}
			</div>
		</div>
	);
};

Window.defaultProps = {
	type: 'default',
	title: undefined,
	compact: false,
	padded: false,
	disabled: undefined,
	onClick: undefined,
};
