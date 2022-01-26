import React from 'react';
import clsx from 'clsx';
import {
	FontAwesomeIcon,
	FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';

export const Toast: React.FC<
	{
		icon?: FontAwesomeIconProps['icon'];
		type: 'red' | 'green' | 'yellow';
	} & ({ banner: true; toast?: false } | { toast: true; banner?: false })
> = ({ icon, banner, toast, type, children }) => {
	const classBase = banner ? 'banner' : 'toast';
	return (
		<div
			className={clsx({
				toast,
				banner,
				[`${classBase}-${type}`]: true,
			})}
		>
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
};
