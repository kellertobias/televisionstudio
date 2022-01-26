import React from 'react';
import clsx from 'clsx';
import {
	FontAwesomeIcon,
	FontAwesomeIconProps,
} from '@fortawesome/react-fontawesome';

export const Button: React.FC<{
	windowMainButton?: boolean;
	className?: string;
	disabled?: boolean;
	onClick?: React.EventHandler<React.MouseEvent>;
	style?: React.HTMLAttributes<HTMLDivElement>['style'];
	icon?: FontAwesomeIconProps['icon'];
}> = ({
	windowMainButton,
	className,
	disabled,
	onClick,
	style,
	icon,
	children,
}) => {
	return (
		<div
			className={clsx(className, 'desk-button', {
				'desk-button-main': windowMainButton,
				'desk-button-disabled': disabled,
			})}
			style={style}
			onClick={(e) => {
				if (disabled) {
					e.stopPropagation();
					e.preventDefault();
					return;
				}
				if (onClick) {
					e.stopPropagation();
					e.preventDefault();
					onClick(e);
				}
			}}
		>
			{icon && children ? (
				<FontAwesomeIcon icon={icon} style={{ marginRight: 5 }} />
			) : null}
			{icon && !children ? (
				<div style={{ textAlign: 'center' }}>
					<FontAwesomeIcon icon={icon} />
				</div>
			) : null}
			{children}
		</div>
	);
};

Button.defaultProps = {
	windowMainButton: false,
	className: '',
	disabled: false,
	onClick: undefined,
	style: {},
	icon: undefined,
};
