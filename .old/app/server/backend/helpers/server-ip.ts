import os from 'os'

const networkInterfaces = os.networkInterfaces();
const addresses : string[] = []
let address : string = 'Not Connected';

  
Object.keys(networkInterfaces).forEach(dev => {
    const iface = networkInterfaces[dev]
    if(!iface) return

    iface.filter(details => {

        if (details.family === 'IPv4' && details.internal === false) {
            addresses.push(details.address);
        }
    });
});
address = addresses[0]

console.log(`Server IP is ${address}`)

export { address }