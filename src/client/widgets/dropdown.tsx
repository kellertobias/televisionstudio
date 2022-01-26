import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const Dropdown: React.FC<{
	toggleOpen?: React.EventHandler<React.MouseEvent>;
	value: number | string;
	options: Record<string, string>;
	placeholder?: string;
	onChange: (string) => void;
}> = ({ toggleOpen, value, options, placeholder, onChange }) => {
	const [isOpen, setOpen] = useState(false);

	return (
		<div className="desk-dropdown" onClick={toggleOpen}>
			<div className="desk-dropdown-button" onClick={() => setOpen(!isOpen)}>
				{value ? (
					options[value]
				) : (
					<div className="desk-dropdown-placeholder">{placeholder}</div>
				)}
				<FontAwesomeIcon icon={['fas', 'caret-down']} />
			</div>
			{isOpen && (
				<div className="desk-dropdown-droppable">
					<div className="desk-menu">
						{Object.entries(options).map(([optionTitle, optionValue]) => (
							<div
								className="desk-menu-entry"
								key={optionValue}
								onClick={() => {
									onChange(optionValue);
									setOpen(false);
								}}
							>
								{optionTitle}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

Dropdown.defaultProps = {
	toggleOpen: undefined,
	placeholder: 'Empty',
};
