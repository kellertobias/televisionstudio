import React, { useState } from 'react';

import { TServerStatus, TServerName } from '@/shared/types/status';
import { Window } from '@/client/widgets/window';
import { BarGraph } from '@/client/widgets/bargraph';
import { useSubscription } from '@/client/helpers/use-subscription';

export const StatusWindow: React.FC = () => {
	const [workload, setWorkload] = useState<null | TServerStatus['workload']>();
	const [warnings, setWarnings] = useState<TServerName[]>([]);

	useSubscription<TServerStatus>('/d/usage', (err, ret) => {
		console.log('Subscription Update');
		if (err) {
			return console.error(err);
		}
		setWorkload(ret.workload);
		setWarnings(ret.warnings);
	});

	return (
		<div className="state-servers">
			<Window type="pink" title="Server State" compact padded>
				{workload?.desk?.cpu >= 0 ? (
					<BarGraph title="Desk" horizontal value={workload?.desk?.cpu} />
				) : null}
				{workload?.obs?.cpu >= 0 ? (
					<BarGraph title="OBS" horizontal value={workload?.obs?.cpu} />
				) : null}

				{warnings?.map((x) => x)}
			</Window>
		</div>
	);
};
