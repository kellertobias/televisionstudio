import React from 'react';

import { Window } from '@/client/widgets/window';
import { Button } from '@/client/widgets/button';

export const ShowInfoWindow: React.FC = () => (
	<div className="tabs-section">
		<Window>
			<div className="desk-button-secondary">
				<Button
					onClick={
						() => true
						// portalStoreUpdate({
						// 	title: "Edit Macros"
						// 	children: <>
						// 		<h1>Not Implemented</h1>
						// 		<p style={fontSize: 16}>Would Change Route to Macro Editor</p>
						// 		<p style={fontSize: 16}>Still shows Time, Countdown, Settings, Showfile Name</p>
						// 		<p style={fontSize: 16}>Button for QR-Code to open page on Tablet</p>
						// 		<p style={fontSize: 16}>Shows scrollable list of macros.</p>
						// 		<p style={fontSize: 16}>Able to enter Edit Screen.</p>
						// 		<p style={fontSize: 16}>Can create steps, set names, trigger, enter actions screen</p>
						// 		<p style={fontSize: 16}>Can add actions. (Select Module, Submodule, Action, then add Parameters)</p>
						// 	</>
						// })
					}
					style={{ opacity: 0.5 }}
					icon={['fas', 'edit']}
				/>
				<Button
					onClick={
						() => true
						// portalStoreUpdate({
						// 	title: "Load Showfile"
						// 	children: <LoadBrowserModal/>
						// })
					}
					icon={['fas', 'folder-open']}
				/>
				<Button
					onClick={
						() => true
						// portalStoreUpdate({
						// 	title: "Main Settings"
						// 	children: <SettingsModal/>
						// })
					}
					icon={['fas', 'tools']}
				/>
			</div>
		</Window>
	</div>
);
