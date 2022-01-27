import React, { useState } from 'react';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
	TMessageGlobalNorm,
	TMessageRates,
	TRateTypes,
} from '@/shared/types/rates';
import { Window } from '@/client/widgets/window';
import { useSubscription } from '@/client/helpers/use-subscription';
import { Button } from '@/client/widgets/button';
import { API } from '@/client/api';

const rateNameMap = {
	master: 'Master',
	obs: 'Graphics',
	dsk1: 'DSK1',
	dsk2: 'DSK2',
};

const nextRatesMap = {
	master: 'obs',
	obs: 'dsk1',
	dsk1: 'dsk2',
	dsk2: 'master',
};

export const RateWindow: React.FC = () => {
	const [selected, setSelected] = useState<TRateTypes>();
	const [rates, setRates] = useState<{
		master: number;
		obs: number;
		dsk1: number;
		dsk2: number;
	} | null>();
	const [framerates, setFramerates] = useState<{
		obs: number;
		atem: number;
	} | null>();

	useSubscription<TMessageRates>('/d/trans-rate', (err, ret) => {
		if (err) {
			return console.error(err);
		}
		setRates({
			master: ret?.master,
			obs: ret?.obs,
			dsk1: ret?.dsk1,
			dsk2: ret?.dsk2,
		});
		// eslint-disable-next-line no-underscore-dangle
		setSelected(ret?._rateSelected);
	});

	useSubscription<TMessageGlobalNorm>('/d/global', (err, ret) => {
		if (err) {
			return console.error(err);
		}
		setFramerates({
			obs: ret.obs?.fps,
			atem: ret.atem?.fps > 30 ? ret.atem?.fps / 2 : ret.atem?.fps,
		});
	});

	return (
		<div className="transition-rate">
			<Window type="green" title="Rate">
				{Object.entries(rates ?? {}).map(([name, rate]) => {
					const framerate = name === 'obs' ? framerates?.obs : framerates?.atem;
					const seconds = rate / framerate;
					const active = selected === name;
					return (
						<div
							className={clsx('rate-section', {
								'rate-section-active': active,
							})}
							key={name}
						>
							<div className="rate-section-active">
								<FontAwesomeIcon
									icon={active ? ['far', 'dot-circle'] : ['far', 'circle']}
								/>
							</div>
							<div className="rate-section-title">{rateNameMap[name]}</div>
							<div className="rate-section-number">
								{Number(seconds).toFixed(2)}
							</div>
						</div>
					);
				})}
				<div className="desk-button-main-row">
					<Button
						windowMainButton
						onClick={() => {
							API.send('/action/rate/change', {
								selectRate: nextRatesMap[selected] ?? 'master',
							});
						}}
					>
						Select Rate
					</Button>
				</div>
			</Window>
		</div>
	);
};
