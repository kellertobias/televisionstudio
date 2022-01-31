import moment from 'moment';
import React, { useState } from 'react';

import { API } from '../api';
import { useSubscription } from '../helpers/use-subscription';
import { Button } from '../widgets/button';
import { Dropdown } from '../widgets/dropdown';
import { Modal } from '../widgets/modal';

const buttonOptions = {
	'1': 'CH1',
	'2': 'CH2',
	'3': 'CH3',
	'4': 'CH4',
	'5': 'CH5',
	'6': 'CH6',
	'7': 'CH7',
	'8': 'CH8',
};

const initialValues = Object.keys(buttonOptions).map(() => {
	// eslint-disable-next-line unicorn/no-useless-undefined
	return undefined;
});

export const SettingsModal: React.FC = () => {
	const [boottime, setBoottime] = useState<string>('');
	const [ip, setIp] = useState<string>('');
	const [channelMap, setChannelMap] =
		useState<(number | undefined)[]>(initialValues);
	const [brightnessMain, setBrightnessMain] = useState<number | undefined>();
	const [brightnessDim, setBrightnessDim] = useState<number | undefined>();

	useSubscription<{
		channelMap: number[];
		panelIp: string;
		panelBoot: string;
		brightnessMain: number;
		brightnessDim: number;
	}>(
		'/d/system-settings',
		(err, ret) => {
			if (err) {
				return console.error(err);
			}
			setChannelMap(ret.channelMap);
			setIp(ret.panelIp);
			setBoottime(ret.panelBoot);

			if (brightnessMain === undefined) {
				setBrightnessMain(ret.brightnessMain);
			}
			if (brightnessDim === undefined) {
				setBrightnessDim(ret.brightnessDim);
			}
		},
		[brightnessDim, brightnessMain],
	);

	return (
		<Modal title="Desk Settings">
			<>
				<div className="settings-modal">
					<div className="modal-section">
						<h2>Button Mapping</h2>
						<div className="button-channel-selector-section">
							{[...new Array(2)].map((_ignore, offset) => (
								<div
									className="button-channel-selector-part"
									// eslint-disable-next-line react/no-array-index-key
									key={`button-selector-${offset}`}
								>
									{[...new Array(4)].map((_ignore2, buttonIndex) => {
										const buttonNumber = buttonIndex + 1 + offset * 4;
										return (
											<div
												className="button-channel-selector"
												key={`button-${buttonNumber}`}
											>
												<div className="button-channel-button">
													{buttonNumber}
												</div>
												<div className="button-channel-channel">
													<Dropdown
														value={channelMap[buttonNumber - 1]}
														placeholder="Select Channel"
														onChange={(value) => {
															channelMap[buttonNumber - 1] = Number.parseInt(
																value,
																10,
															);
															setChannelMap(channelMap);

															API.send('/action/system-settings/channel-map', {
																channelMap,
															});
														}}
														options={buttonOptions}
													/>
												</div>
											</div>
										);
									})}
								</div>
							))}
						</div>
					</div>
					<div className="modal-section">
						<h2>Button Brightness</h2>
						<div className="brightness-faders-section">
							{['brightnessMain', 'brightnessDim'].map((key) => {
								const faderName =
									key === 'brightnessMain'
										? 'Main Brightness'
										: 'Dimmed Brightness';
								const value =
									key === 'brightnessMain' ? brightnessMain : brightnessDim;
								const setValue =
									key === 'brightnessMain'
										? setBrightnessMain
										: setBrightnessDim;

								return (
									<div className="brightness-fader" key={faderName}>
										<div className="brightness-fader-position">
											<input
												type="range"
												id={key}
												name={key}
												min="0"
												max="255"
												value={value ?? 0}
												onChange={(e) => {
													const currentValue = Number.parseInt(
														e.currentTarget.value,
														10,
													);
													console.log({ key, currentValue });
													setValue(currentValue);
													API.send('/action/system-settings/brightness', {
														main: brightnessMain,
														dim: brightnessDim,
													});
												}}
											/>
											<label htmlFor={key}>
												{value}
												<br />
												<b>{faderName}</b>
											</label>
										</div>
									</div>
								);
							})}
						</div>
					</div>
					<div className="modal-section">
						<h2>Misc.</h2>
						<div className="">
							<div className="system-status">
								Uptime: {moment(boottime).fromNow()}
								<br />
								Panel IP: {ip}
							</div>
							<div className="system-section">
								<Button
									onClick={() =>
										API.send('/action/system-settings/power', { reload: true })
									}
								>
									Reload Macros
								</Button>
								<Button
									onClick={() =>
										API.send('/action/system-settings/power', {
											shutdown: true,
										})
									}
								>
									Shutdown
								</Button>
							</div>
						</div>
					</div>
				</div>
			</>
		</Modal>
	);
};
