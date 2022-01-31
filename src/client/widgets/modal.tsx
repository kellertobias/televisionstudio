import React from 'react';
import { useHistory } from 'react-router-dom';
import { FontAwesomeIconProps } from '@fortawesome/react-fontawesome';

import { Button } from './button';
import { Scrollable } from './scroll';

export const Modal: React.FC<{
	type?: 'default' | 'orange' | 'purple' | 'blue' | 'pink' | 'red' | 'green';
	title: string;
	onClose?: () => void;
	onSave?: () => void;
	cancelTitle?: string;
	saveIcon?: FontAwesomeIconProps['icon'];
	saveTitle?: string;
}> = ({
	onClose,
	type,
	title,
	children,
	onSave,
	cancelTitle,
	saveIcon,
	saveTitle,
}) => {
	const history = useHistory();
	const closeModal =
		onClose ??
		(() => {
			console.log('On Close');
			history.push('/desk');
		});
	return (
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
				onClick={closeModal}
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
					<Button onClick={closeModal} icon={['fas', 'times']} />
				</div>
				{title ?? <div className="window-title">{title}</div>}
				<div className="window-content">
					<Scrollable>{children}</Scrollable>
				</div>
				{(onSave || cancelTitle) && (
					<div className="modal-menu">
						{cancelTitle && <Button onClick={closeModal}>{cancelTitle}</Button>}
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
};

Modal.defaultProps = {
	onSave: undefined,
	cancelTitle: undefined,
	saveIcon: undefined,
	saveTitle: undefined,
	type: 'default',
	onClose: undefined,
};
