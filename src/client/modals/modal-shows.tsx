// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable unicorn/no-nested-ternary */
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import clsx from 'clsx';

import { API } from '../api';
import { Modal } from '../widgets/modal';
import { Button } from '../widgets/button';
import { useCall } from '../helpers/use-call';

type File = { type: 'file' | 'folder'; name: string };
type Current = { title: string; file: string };

const checkIsShowfile = (file: File) =>
	file.type === 'file' &&
	(file.name.endsWith('.yml') || file.name.endsWith('.yaml'));

const checkIsFolder = (file: File) => file.type === 'folder';

const getTopLevelSorting = (file: File) => {
	if (checkIsShowfile(file)) {
		return 1;
	}
	if (checkIsFolder(file)) {
		return 0;
	}
	return 2;
};

export const ShowModal: React.FC<{ path: string | undefined }> = ({ path }) => {
	const [content, setContent] = useState(null);
	const [current, setCurrent] = useState<Current | undefined>();
	const history = useHistory();

	console.log({ path });

	useCall<{ files: File[]; current: Current }>(
		'/action/loader/browser',
		{ subpath: path },
		(err, ret) => {
			console.log('Loaded Content', err, ret);
			if (err) {
				return console.error(err);
			}

			const tree = (ret.files ?? []).sort((a, b) => {
				const topA = getTopLevelSorting(a);
				const topB = getTopLevelSorting(b);
				if (topA !== topB) {
					return topA - topB;
				}
				return 0;
			});

			setContent(tree);
			setCurrent(ret.current);
		},
		[path],
	);

	const changeDirectory = (newDir: string) => {
		console.log(history.location, newDir);
		if (newDir === '..') {
			const pathParts = history.location.pathname.split('/');
			pathParts.pop();
			history.push(pathParts.join('/'));
		} else {
			history.push(`${history.location.pathname}/${newDir}`);
		}
	};

	const loadShowfile = (file) => {
		const subpath = `${path}/${file}`;
		API.call('/action/loader/load', { subpath }, (err) => {
			if (err) {
				return console.error(err);
			}
			history.push('/desk');
		});
	};

	if (!content) {
		return (
			<Modal title="Load Showfile" type="orange">
				<div className="settings-modal">Loading...</div>
			</Modal>
		);
	}

	return (
		<Modal title="Load Showfile" type="orange">
			<div className="settings-modal">
				<div className="modal-section">
					<div className="load-files">
						{content.length === 0 && <>Directory is Empty</>}
						{content.length > 0 &&
							content.map((file) => {
								const isShowfile = checkIsShowfile(file);
								const isFolder = checkIsFolder(file);

								return (
									<div className="load-files-single" key={file.name}>
										<Button
											className={clsx({
												'button-green': isShowfile,
												'button-orange': isFolder,
											})}
											disabled={!(isShowfile || isFolder)}
											icon={
												isShowfile
													? ['fas', 'file-archive']
													: isFolder
													? ['fas', 'folder']
													: ['fas', 'question']
											}
											onClick={() => {
												if (isFolder) {
													return changeDirectory(file.name);
												}
												if (isShowfile) {
													return loadShowfile(file.name);
												}
											}}
										>
											{isShowfile ? (
												<>
													<b>{file.name}</b> (Load)
												</>
											) : isFolder ? (
												<>
													<b>{file.name}</b> (Enter)
												</>
											) : (
												file.name
											)}
										</Button>
									</div>
								);
							})}
					</div>
					<div className="load-files-current">
						<b>{current?.title ?? 'Built-In Showfile'}</b>
						<br />
						{current?.file}
					</div>
					<div className="load-files-actions">
						{path && (
							<Button
								icon={['fas', 'level-up-alt']}
								onClick={() => {
									changeDirectory('..');
								}}
							>
								Back
							</Button>
						)}

						{!path && (
							<Button icon={['fas', 'level-up-alt']} disabled>
								Back
							</Button>
						)}
					</div>
				</div>
			</div>
		</Modal>
	);
};
