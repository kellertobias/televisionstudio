"""
This little Script sends random Program and Preview messages and displays whatever it receives.

Original Author: Brent Rubell for Adafruit Industries
"""
# Import Python System Libraries
import time
# Import Blinka Libraries
import busio
from digitalio import DigitalInOut, Direction, Pull
import board
import json
from random import randrange

# Import RFM9x
import adafruit_rfm9x

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

rfm9x.tx_power = 10
rfm9x.signal_bandwidth = 7800
rfm9x.coding_rate = 8
rfm9x.spreading_factor = 7
rfm9x.enable_crc = False
rfm9x.destination = 0xff
rfm9x.node = 0xff
rfm9x.preamble_length = 8
rfm9x.listen()

prev_packet = None

cooldown = 0

while True:
    packet = None
    # draw a box to clear the image
    # check for packet rx
    packet = rfm9x.receive()
    if packet is None:
        # print("No Packet")
        time.sleep(0.1)
        if cooldown == 0:
            data = "ATM,%d,%d" % (randrange(16), randrange(16))
            print("Sending `%s`" % data)
            data_bytes = bytes("%s\r\n" % data,"utf-8")
            rfm9x.send(data_bytes)
            cooldown = 10
        cooldown -= 1
    else:
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
        time.sleep(0.01)

