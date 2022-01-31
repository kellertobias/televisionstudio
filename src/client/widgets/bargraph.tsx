import clsx from 'clsx';
import React from 'react';

export const BarGraph: React.FC<
	{
		width?: number;
		value: number;
		title?: string;
	} & (
		| {
				horizontal: true;
				vertical?: false;
		  }
		| {
				horizontal?: false;
				vertical: true;
		  }
	)
> = ({ vertical, horizontal, width, value, title }) => (
	<div
		className={clsx('bar-graph', {
			'bar-graph-vertical': horizontal !== true || vertical,
			'bar-graph-horizontal': horizontal || vertical !== true,
		})}
		style={
			width === undefined
				? {}
				: {
						[horizontal ? 'height' : 'width']: width + 3,
				  }
		}
	>
		<div
			className="bar-graph-area"
			style={{
				...(width === undefined
					? {}
					: { [horizontal ? 'height' : 'width']: width }),

				...(width !== undefined && horizontal
					? {
							marginTop: 1,
							marginBottom: 1,
					  }
					: {}),
				...(width !== undefined && horizontal !== true
					? {
							marginLeft: 1,
							marginRight: 1,
					  }
					: {}),
			}}
		>
			<div className="bar-graph-level-back" />
			<div
				className="bar-graph-level"
				style={{
					clipPath:
						horizontal !== true
							? `inset(${100 - value * 100}% 0 0 0)`
							: `inset(0 ${100 - value * 100}% 0 0)`,
				}}
			/>
		</div>
		{title && <div className="bar-graph-title">{title}</div>}
	</div>
);

BarGraph.defaultProps = {
	width: undefined,
	title: undefined,
	// eslint-disable-next-line react/default-props-match-prop-types
	horizontal: false,
};
