import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import React, { useState } from 'react';
import { useHistory } from 'react-router';

import { API } from '../api';
import { useInterval } from '../helpers/use-interval';
import { useSubscription } from '../helpers/use-subscription';
import { Button } from '../widgets/button';
import { Modal } from '../widgets/modal';

const fixDate = (date: Date | string | moment.Moment) => {
	const dateMoment = moment(date);
	dateMoment.set({ second: 0, millisecond: 0 });
	return dateMoment.toDate();
};

const initialShowStart = moment('20:00');
//     showStart.set(second: 0, millisecond: 0)

export const TimeModal: React.FC = () => {
	const [time, setTime] = useState<Date>(new Date());
	const [showStart, setShowStart] = useState<Date>(fixDate(initialShowStart));

	const history = useHistory();

	useInterval(1000, () => {
		setTime(new Date());
	});

	useSubscription<{ showStart: string }>('/d/calendar', (err, ret) => {
		if (err) {
			return console.error(err);
		}
		setShowStart(fixDate(ret.showStart));
	});

	const save = () => {
		API.call('/action/system/set-target-time', { time: showStart });
		history.push('/desk');
	};

	const renderPickerBlock = (currentShowStart, value, part, title) => {
		return (
			<div className="picker-block">
				<div
					className="picker-top"
					onClick={() => {
						currentShowStart.subtract(1, part);
						setShowStart(currentShowStart);
					}}
				>
					<FontAwesomeIcon icon={['fas', 'minus']} />
				</div>
				<div className="picker-mid">
					<div className="picker-value">{value}</div>
					<div className="picker-title">{title}</div>
				</div>
				<div
					className="picker-bottom"
					onClick={() => {
						currentShowStart.add(1, part);
						setShowStart(currentShowStart);
					}}
				>
					<FontAwesomeIcon icon={['fas', 'plus']} />
				</div>
			</div>
		);
	};

	const showStartMoment = moment(showStart);
	const duration = moment.duration(moment(time).diff(showStart)) as unknown as {
		format: (format: string) => string;
	};

	return (
		<Modal title="Set Countdown Target">
			<div className="time-modal">
				<h1>Set Show Start time</h1>
				<div className="picker-form">
					{renderPickerBlock(
						showStartMoment,
						`+ ${showStartMoment.format('DD')}`,
						'day',
						'Day',
					)}
					{renderPickerBlock(
						showStartMoment,
						`+ ${showStartMoment.format('MM')}`,
						'day',
						'Month',
					)}
					{renderPickerBlock(
						showStartMoment,
						showStartMoment.format('HH'),
						'hour',
						'Hour',
					)}
					{renderPickerBlock(
						showStartMoment,
						showStartMoment.format('mm'),
						'minute',
						'Minute',
					)}
				</div>
				<div className="time-target">
					{moment(showStartMoment).format('dddd, DD.MM.YYYY HH:mm:ss')} (
					{`T${duration.format('HH:mm:ss')}`})
				</div>

				<div className="time-modal-save-button">
					<Button
						onClick={() => {
							setShowStart(moment().add(1, 'hour').startOf('hour').toDate());
						}}
					>
						Set to next Hour
					</Button>
					<Button onClick={save}>Save</Button>
				</div>
			</div>
		</Modal>
	);
};
