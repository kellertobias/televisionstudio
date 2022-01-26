import React from 'react';
// import ScrollContainer from 'react-indiana-drag-scroll';

export const Scrollable: React.FC = ({ children }) => {
	return <div className="scroll-container">{children}</div>;
};
