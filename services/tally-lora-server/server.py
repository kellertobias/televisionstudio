"""
LoRa Tally Sender
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Thread

import time

import busio
from digitalio import DigitalInOut, Direction, Pull
import board
import adafruit_rfm9x

import threading

SERVER_PORT = 9868

# Configure LoRa Radio
RADIO_FREQ_MHZ = 868.0

CS = DigitalInOut(board.D25)
RESET = DigitalInOut(board.D17)
spi = busio.SPI(board.SCK, MOSI=board.MOSI, MISO=board.MISO)
rfm9x = adafruit_rfm9x.RFM9x(
    spi,
    CS,
    RESET,
    RADIO_FREQ_MHZ,
    preamble_length=8,
    high_power=True,
    baudrate=115200
)

rfm9x.tx_power = 20
rfm9x.signal_bandwidth = 125000
rfm9x.coding_rate = 5
rfm9x.spreading_factor = 7
rfm9x.enable_crc = False
rfm9x.destination = 0xff
rfm9x.node = 0xff
rfm9x.preamble_length = 8
rfm9x.listen()

prev_packet = None

cooldown = 0

current_pgm = 0
current_pvw = 0
sending = False


def send(pgm, pvw):
    if sending:
        return
    sending = True

    try:
        data = "ATM,%d,%d" % (pgm, pvw)
        print("Sending `%s`" % data)
        data_bytes = bytes("%s\r\n" % data, "utf-8")
        rfm9x.send(data_bytes)
    except Exception as e:
        print(e)

    sending = False


def sendInterval():
    while True:
        time.sleep(10)
        send(current_pgm, current_pvw)


def receive():
    while True:
        packet = None
        # draw a box to clear the image
        # check for packet rx
        try:
            packet = rfm9x.receive()
        except Exception as e:
            print(e)
            time.sleep(0.1)
            continue

        if packet is None:
            time.sleep(0.1)
        else:
            time.sleep(0.1)
            try:
                # Display the packet text and rssi
                prev_packet = packet
                print("Received (raw bytes): {0}".format(packet))
                rssi = rfm9x.last_rssi
                print("Received signal strength: {0} dB".format(rssi))
                try:
                    print(list(prev_packet))
                    packet_text = str(prev_packet, "utf-8", errors="ignore")
                    print(packet_text)
                except Exception as e:
                    print(e)
            except Exception as e:
                print(e)


class MyServer(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            if not self.path.startswith('/tally'):
                self.send_response(404)
                self.send_header("Content-type", "text/html")
                self.end_headers()
                self.wfile.write(bytes("NOT-FOUND", "utf-8"))
                return
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            [path, query] = self.path.split('?')
            queryParts = query.split('&')
            params = {}
            for queryPart in queryParts:
                [key, value] = queryPart.split('=')
                params[key] = value
            print(path, params)

            current_pgm = int(params['pgm'])
            current_pvw = int(params['pvw'])

            send(current_pgm, current_pvw)
            self.wfile.write(bytes("SENT", "utf-8"))
        except Exception as e:
            print(e)


if __name__ == "__main__":
    webServer = HTTPServer(('0.0.0.0', SERVER_PORT), MyServer)
    print("Server started http:0.0.0.0/:%s" % SERVER_PORT)

    thread = Thread(target=sendInterval)
    thread.start()

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    thread.join()
    print("Server stopped.")
