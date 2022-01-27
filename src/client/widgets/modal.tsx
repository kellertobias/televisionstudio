import React from 'react';

import { Button } from './button';
import { Scrollable } from './scroll';

export const Modal = ({
	onClose,
	type,
	title,
	children,
	onSave,
	cancelTitle,
	saveIcon,
	saveTitle,
}) => (
	<>
		<div
			style={{
				position: 'fixed',
				left: 0,
				top: 0,
				right: 0,
				bottom: 0,
				backgroundColor: 'rgba(25,25,25,0.8)',
				cursor: 'pointer',
				zIndex: 198,
			}}
			onClick={onClose}
		/>
		<div
			className={[
				'window',
				'modal-window',
				'window-titled',
				`window-${type ?? 'default'}`,
			].join(' ')}
		>
			<div className="modal-close">
				<Button onClick={onClose} icon={['fas', 'times']} />
			</div>
			{title ?? <div className="window-title">{title}</div>}
			<div className="window-content">
				<Scrollable>{children}</Scrollable>
			</div>
			{(onSave || cancelTitle) && (
				<div className="modal-menu">
					{cancelTitle && <Button onClick={onClose}>{cancelTitle}</Button>}
					{onSave && (
						<Button onClick={onSave} icon={saveIcon}>
							{saveTitle}
						</Button>
					)}
				</div>
			)}
		</div>
	</>
);
