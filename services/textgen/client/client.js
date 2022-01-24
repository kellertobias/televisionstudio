var queryParameters = {}
try {
    var queryStringContent = decodeURI(location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"')
    if(queryStringContent) {
        queryParameters = JSON.parse('{"' + queryStringContent + '"}')
        Object.keys(queryParameters).forEach((key) => {
            let numberValue = Number(queryParameters[key])
            if(!isNaN(numberValue)) {
                queryParameters[key] = numberValue
            }
        })
    }
} catch (error) {
    console.error("Could not Parse Query String", error)
}

function createNode(type, className, options) {
    const {html, text, nodes} = (options || {})
    var node = document.createElement(type)
    node.className = className
    if(text) node.innerText = text
    if(html) node.innerHTML = html
    if(nodes) nodes.forEach((n) => {
        node.appendChild(n)
    })

    return node
}

function pad(num, size) {
    var s = "000000000" + num;
    return s.substr(s.length-size);
}

function createTextNode (text, className) {
    var textWrapper = document.createElement('div')
    textWrapper.className = className
    for (var i = 0; i < text.length; i++) {
        var textNode = document.createElement('span')
        textNode.innerText = text.charAt(i)
        textWrapper.appendChild(textNode)
    }
    return textWrapper
}

var fadeInDuration = queryParameters.fade !== undefined ? queryParameters.fade : 1

var style = document.createElement("style");
document.querySelector('body').appendChild(style);
style.innerHTML = `
.animation-fadein {
    opacity: 1;
    animation: fadeIn ${Number(fadeInDuration).toFixed(1)}s linear;
}
`

function setupClient (scopeName, renderCallback) {
    var timerId = null;
    var pingPongTimer = null;
    window.sendMessage = function(message) {
        const dataToSend = JSON.stringify(message);
        let dataReceived = ""; 
        fetch("/text", {
            credentials: "same-origin",
            mode: "same-origin",
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: dataToSend
        })
    }

    function websocketConnect(){
        var ws = new WebSocket((window.location.protocol == 'https:' ? 'wss://' : 'ws://')
            + window.location.host);

        ws.onopen = function () {
            console.log("Connection Opened")
            if(timerId !== null) clearInterval(timerId);
            if(pingPongTimer !== null) clearInterval(pingPongTimer);
            ws.send("PING")
            pingPongTimer = setInterval(function() {
                ws.send("PING")
            }, 1000);
            ws.onclose = function () {
                timerId = setInterval(function() {
                    websocketConnect()
                }, 1000);
            };
        };

        ws.onmessage = function (message) {
            if(message.data == "PONG") {
                return
            }
            var data = JSON.parse(message.data || "{}");
            console.log("message received: ", data);
            if(data.scope != scopeName) {
                console.log("Message not in scope")
                return
            }
            renderCallback(data)
        };
    }

    if(scopeName) websocketConnect()
}

console.log("Generic Client Loaded:", queryParameters)
