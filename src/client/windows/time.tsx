import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import moment from 'moment';
import 'moment-duration-format';

import { Window } from '@/client/widgets/window';
import { Button } from '@/client/widgets/button';
import { useSubscription } from '@/client/helpers/use-subscription';
import { useInterval } from '@/client/helpers/use-interval';

export const TimeWindow: React.FC = () => {
	const [showStart, setShowStart] = useState<string | null>(null);
	const [time, setTime] = useState<Date>(new Date());
	const history = useHistory();

	useSubscription<{ showStart: string }>('/d/calendar', (err, ret) => {
		if (err) {
			return console.error(err);
		}
		setShowStart(ret.showStart);
	});

	useInterval(1000, () => {
		setTime(new Date());
	});

	const duration = moment.duration(moment(time).diff(showStart));
	return (
		<>
			<div className="time-clock">
				<Window title="Current Time" titleMicro>
					{moment(time).format('HH:mm:ss')}
				</Window>
			</div>
			<div className="time-countdown">
				<Window
					title="On Air in..."
					titleMicro
					onClick={() => history.push('/desk/showtime')}
				>
					{showStart
						? `T${(
								duration as unknown as { format: (x: string) => string }
						  ).format('HH:mm:ss')}`
						: 'Not Set'}
					<div className="desk-button-mini-row">
						<Button icon="cog" />
					</div>
				</Window>
			</div>
		</>
	);
};
