import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import clsx from 'clsx';

import { API } from '../api';
import { Modal } from '../widgets/modal';
import { Button } from '../widgets/button';

const checkIsShowfile = (file) =>
	file.type === 'file' &&
	(file.name.endsWith('.yml') || file.name.endsWith('.yaml'));

const checkIsFolder = (file) => file.type === 'folder';

const getTopLevelSorting = (file) => {
	if (checkIsShowfile(file)) {
		return 1;
	}
	if (checkIsFolder(file)) {
		return 0;
	}
	return 2;
};

export const ShowModal: React.FC = () => {
	const [currentTree, setTree] = useState([]);
	const [currentSubpath, setSubpath] = useState([]);
	const [current, setCurrent] = useState<
		{ title: string; file: string } | undefined
	>();

	const history = useHistory();

	const loadDirectory = (subpath) => {
		API.call('/action/loader/browser', { subpath }, (err, ret) => {
			if (err) {
				return console.error(err);
			}

			const tree = (ret.files ?? []).sort((a, b) => {
				const topA = getTopLevelSorting(a);
				const topB = getTopLevelSorting(b);
				if (topA !== topB) {
					return topA - topB;
				}
				return a - b;
			});
			setTree(tree);
			setSubpath(subpath);
			setCurrent(ret.current);
		});
	};

	const loadShowfile = (subpath) => {
		API.call('/action/loader/load', { subpath }, (err, ret) => {
			if (err) {
				return console.error(err);
			}
			history.push('/desk');
		});
	};

	return (
		<Modal title="Load Showfile" type="orange">
			<div className="settings-modal">
				<div className="modal-section">
					<div className="load-files">
						{currentTree.map((file) => {
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
											const newFolder = [...currentSubpath, file.name];
											if (isFolder) {
												return loadDirectory(newFolder);
											}
											if (isShowfile) {
												return loadShowfile(newFolder);
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
						{currentSubpath.length > 0 && (
							<Button
								icon={['fas', 'level-up-alt']}
								onClick={() => {
									const newFolder = [...currentSubpath];
									newFolder.pop();
									console.log(newFolder);
									loadDirectory(newFolder);
								}}
							>
								Back
							</Button>
						)}
						<Button
							icon={['fas', 'sync-alt']}
							onClick={() => loadDirectory(currentSubpath)}
						>
							Reload Files
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
};
