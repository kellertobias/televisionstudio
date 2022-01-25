import React from 'react';
import _ from 'underscore'
import moment from 'moment'
import 'moment-duration-format';
import { Dropdown } from '../../widgets/dropdown'
import { Button } from '../../widgets/button'
import { api } from '/client/model'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {portalStoreUpdate} from '../../widgets/modal'


export class LoadBrowserModal extends React.Component
	constructor: (props) ->
		super(props)

		this.state = {
			tree: []
			subpath: []
			current: {}
		}

	isShowfile: (file) =>
		return file.type == 'file' and (file.name.endsWith('.yml') or file.name.endsWith('.yaml'))
	
	isFolder: (file) =>
		return file.type == 'folder'

	getTopLevelSorting: (file) =>
		if this.isShowfile(file)
			return 1
		if this.isFolder(file)
			return 0
		return 2

	loadDirectory: (subpath) =>
		api.call('/action/loader/browser', {subpath}, (err, ret) =>
			if err
				return console.error(err)
			console.log(err, ret)
			tree = (ret.files ? []).sort((a, b) => 
				topA = this.getTopLevelSorting(a)
				topB = this.getTopLevelSorting(b)
				if topA != topB
					return topA - topB
				return a - b
			)
			this.setState({tree, subpath, current: ret.current})
		)

	loadShowfile: (subpath) =>
		api.call('/action/loader/load', {subpath}, (err, ret) =>
			if err
				return console.error(err)
			portalStoreUpdate()
		)


	componentDidMount: () =>
		this.loadDirectory([])

	render: ->
		return <>
			<div className="settings-modal">
				<div className="modal-section">
					<div className="load-files">
						{_.map(this.state.tree, (file) =>
							isShowfile = this.isShowfile(file)
							isFolder = this.isFolder(file)

							return <div className="load-files-single" key={file.name}>
								<Button
									className={switch
											when isShowfile
												'button-green'
											when isFolder
												'button-orange'
											else
												''
									}
									disabled={not (isShowfile or isFolder)}
									icon={
										switch
											when isShowfile
												['fas', 'file-archive']
											when isFolder
												['fas', 'folder']
											else
												['fas', 'question']
									}
									onClick={() =>
										newFolder = [...this.state.subpath, file.name]
										if(isFolder)
											return this.loadDirectory(newFolder)
										if(isShowfile)
											this.loadShowfile(newFolder)
									}
								>
									{if isShowfile
										<><b>{file.name}</b> (Load)</>
									else if isFolder
										<><b>{file.name}</b> (Enter)</>
									else
										file.name
									}
								</Button>
							</div>
						)}

					</div>
					<div className="load-files-current">
						<b>{this.state.current.title ? "Built-In Showfile"}</b><br/>
						{this.state.current.file}
					</div>
					<div className="load-files-actions">
						{if this.state.subpath.length > 0 
							<Button
								icon={['fas', 'level-up-alt']}
								onClick={() =>
									newFolder = [...this.state.subpath]
									newFolder.pop()
									console.log(newFolder)
									this.loadDirectory(newFolder)
								}
							>
								Back
							</Button>
						}
						<Button
							icon={['fas', 'sync-alt']}
							onClick={() =>
								this.loadDirectory(this.state.subpath)
							}
						>
							Reload Files 
						</Button>
					</div>
				</div>
			</div>
		</>