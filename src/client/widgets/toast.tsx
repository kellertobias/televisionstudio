import {
  FontAwesomeIcon,
  FontAwesomeIconProps
} from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import React from 'react';

import { Button } from './button';

export const Toast: React.FC<
	{
		icon?: FontAwesomeIconProps['icon'];
		type: 'red' | 'green' | 'yellow';
		onClose?: () => void;
	} & ({ banner: true; toast?: false } | { toast: true; banner?: false })
> = ({ icon, banner, toast, type, children, onClose }) => {
	const classBase = banner ? 'banner' : 'toast';
	return (
		<div
			className={clsx({
				toast,
				banner,
				[`${classBase}-${type}`]: true,
			})}
		>
			{onClose && (
				<div className="banner-close">
					<Button onClick={onClose} icon={['far', 'times-circle']} />
				</div>
			)}
			{icon ? (
				<div className={`${classBase}-icon`}>
					<FontAwesomeIcon icon={icon} style={{ marginRight: '5px' }} />
				</div>
			) : null}
			<div className={`${classBase}-text`}>{children}</div>
		</div>
	);
};

Toast.defaultProps = {
	icon: undefined,
	onClose: undefined,
};
