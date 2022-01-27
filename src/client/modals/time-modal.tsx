// export class TimeModal extends React.Component
// constructor: (props) ->
//     super(props)
//     showStart = moment(props.target) || moment('20:00')
//     showStart.set(second: 0, millisecond: 0)
//     this.state = {
//         showStart: showStart.toDate()
//         time: new Date()
//     }

// componentWillReceiveProps: (nextProps) =>
//     showStart = moment(nextProps.target) || moment('20:00')
//     showStart.set(second: 0, millisecond: 0)
//     this.setState({showStart: showStart.toDate()})

// componentDidMount: () =>
//     this.interval = setInterval(this.tick, 1000)

// componentWillUnmount: () =>
//     clearInterval(this.interval)

// tick: () =>
//     this.setState({time: new Date()})

// onSave: () =>
//     api.send('/action/system/set-target-time', {time: this.state.showStart})
//     portalStoreUpdate(null)

// renderPickerBlock: (showStart, value, part, title) =>
//     return <div className="picker-block">
//         <div className="picker-top" onClick={() =>
//             showStart.subtract(1, part)
//             this.setState({showStart})
//         }>
//             <FontAwesomeIcon
//                 icon={['fas', 'minus']}
//             />
//         </div>
//         <div className="picker-mid">
//             <div className="picker-value">{value}</div>
//             <div className="picker-title">{title}</div>
//         </div>
//         <div className="picker-bottom" onClick={() =>
//             showStart.add(1, part)
//             this.setState({showStart})
//         }>
//             <FontAwesomeIcon
//                 icon={['fas', 'plus']}
//             />
//         </div>
//     </div>

// render: () =>
//     showStart = moment(this.state.showStart)

//     duration = moment.duration(moment(this.state.time).diff(showStart))

//     return <div className="time-modal">
//         <h1>Set Show Start time</h1>
//         <div className="picker-form">
//             {this.renderPickerBlock(showStart, '+ ' + showStart.diff(moment(), 'days'), 'day', 'Days')}
//             {this.renderPickerBlock(showStart, showStart.format('HH'), 'hour', 'Hour')}
//             {this.renderPickerBlock(showStart, showStart.format('mm'), 'minute', 'Minute')}
//         </div>
//         <div className="time-target">
//             {moment(this.state.showStart).format('dddd, DD.MM.YYYY HH:mm:ss')} ({"T" + duration.format('HH:mm:ss')})
//         </div>

//         <div className="time-modal-save-button">
//             <Button onClick={this.onSave}>
//                 Save
//             </Button>
//         </div>
//     </div>
