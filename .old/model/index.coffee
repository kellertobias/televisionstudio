import {nanoid} from 'nanoid'

class APIConnection
	constructor: (url) ->
		this.url = url
		this.endpointHandlers = {}
		this.methodCallbacks = {}
		this.callbacks = {}
		this.connected = false
		this.connecting = false
		this.interval = null
		this.disconnectHandler = []
		
		this.initialSources = {}

		this.connect()

	connect: () =>
		console.log("Trying to open Websocket")
		this.connecting = true
		this.ws = new WebSocket(this.url);

		this.ws.onerror = (error) =>
			console.error("Websocket Error", error)
			this.ws.close()
			this.connecting = false

		this.ws.onopen = () =>
			console.log("Websocket Open")
			this.connected = true
			this.connecting = false
			(this.disconnectHandler || []).forEach((handler) =>
				handler(true)
			)

		this.ws.onclose = (e) =>
			this.connected = false
			this.connecting = false
			console.log('Socket is closed. Reconnect will be connecting in 1 second.', e?.reason);
			(this.disconnectHandler || []).forEach((handler) =>
				handler(false)
			)
			if this.interval == null
				clearInterval(this.interval)

			this.interval = setInterval(() =>
				if !this.connected and !this.connecting
					this.connect();
			, 1000);

		this.ws.onmessage = this.onMessage
			

	onMessage: (event) =>
		try
			msg = JSON.parse(event.data)
			if msg.t == 'pong'
				return this.pong()

			endpoint = [msg.m, msg.i].filter((x) => return x).join('/')

			handlers = Object.values(this.endpointHandlers[endpoint] ? {})

			handlers.forEach (handler) =>
				handler(msg.e, msg.d)
			
			if not handlers?
				console.log('[API] ' + msg.m + ' - ' + (msg.i ? msg.t), msg.d)

			if(msg.t == 'publish')
				this.initialSources[msg.m] = msg.d

		catch e
			handlers.forEach (handler) =>
				handler(e, null)

			if not handlers?
				console.error('[API] ' + msg.m + ' - ' + (msg.i ? msg.t), msg.e)

	
	send: (method, data, opt = {}) =>
		console.log("[API] CALLING #{method}")
		if !this.connected
			console.log("...NOT CONNECTED")
			return

		{id, type} = opt
		id ?= nanoid()
		type ?= 'method'

		this.ws.send(JSON.stringify({
			t: type
			m: method,
			i: id,
			d: data
		}))

	call: (method, params, cb) =>
		if typeof params == 'function'
			cb = params
			params = {}

		prm = new Promise (resolve, reject) =>
			id = nanoid()
			this.send(method, params, {id})
			destroyHandler = this.subscribe(method + '/' + id, (err, res) =>
				destroyHandler()
				if err
					return reject(err)
				return resolve(res)
			)
		if not cb
			return prm

		prm.catch((err) =>
			cb(err, null)
		).then((res) =>
			cb(null, res)
		)

			

	subscribe: (endpoint, handler) =>
		id = nanoid()
		this.endpointHandlers[endpoint] ?= {}
		this.endpointHandlers[endpoint][id] = handler
		if(this.initialSources[endpoint]?)
			handler(null, this.initialSources[endpoint])

		return () =>
			delete this.endpointHandlers[endpoint][id]

	onStatus: (handler) =>
		this.disconnectHandler ?= []
		this.disconnectHandler.push(handler)


api = new APIConnection('ws://localhost:9898')
window.api = api
export {api}

	
