import socket
import sys
import os

import serial
import threading
import json


MESSAGE_HEADER = [0b10101010, 0b00000000]
MESSAGE_FOOTER = [0b11111111, 0b00000000]
ADDR_FADER = 0b00000001
ADDR_ENCODER = 0b10000001

EXISING_ADDRESSES = [ADDR_ENCODER, ADDR_FADER] + \
    MESSAGE_HEADER + MESSAGE_FOOTER
BUTTON_ADDRESSES = [None] * 100

addressIterator = 0
for k in range(2):
    for r in range(5):
        for c in range(9):
            addressIterator += 1
            while addressIterator in EXISING_ADDRESSES:
                addressIterator += 1
            BUTTON_ADDRESSES[addressIterator] = (k, r, c)

configLocations = [
    '../../config/devices.json',
    '../desk/config/devices.json',
]
for configLocation in configLocations:
    print("Try: %s" % configLocation)
    sys.stdout.flush()
    if os.path.exists(configLocation):
        print(" -> Loading Config.")
        config = json.load(open(configLocation))
        break

PORT = config["desk"]["port"]
SERDEV = config["desk"]["dev"]
BAUD = config["desk"].get("baud", 250000)

# open serial port
ser = serial.Serial(SERDEV, baudrate=BAUD)
print("Connected to %s" % ser.name)
sys.stdout.flush()

connections = []

ServerSocket = socket.socket()
try:
    print("Starting Server localhost:%s" % PORT)
    ServerSocket.bind(('localhost', PORT))
except socket.error as e:
    print(str(e))
    sys.stdout.flush()
    sys.exit(1)

killed = False

lastMsg = []


def serial_write(data):
    global lastMsg
    msg = MESSAGE_HEADER + [0x00] + data + MESSAGE_FOOTER
    if lastMsg != msg:
        print("Sending: ", msg)
        sys.stdout.flush()
        lastMsg = msg
    ser.write(msg)


def start_serial_read():
    print('Serial Reader is Started')
    sys.stdout.flush()
    address = None
    value = None
    readState = 'IDLE'
    while not killed:
        data = ser.read_until(expected=MESSAGE_FOOTER, size=6)
        if data[0] != MESSAGE_HEADER[0]:
            print("Header A Missing")
            sys.stdout.flush()
            continue
        if data[1] != MESSAGE_HEADER[1]:
            print("Header B Missing")
            sys.stdout.flush()
            continue
        if data[4] != MESSAGE_FOOTER[0]:
            print("Footer A Missing")
            sys.stdout.flush()
            continue
        if data[5] != MESSAGE_FOOTER[1]:
            print("Footer B Missing")
            sys.stdout.flush()
            continue
        address = data[2]
        value = data[3]
        if address == ADDR_FADER:
            k = 2
            r = 0
            c = 0
        elif address == ADDR_ENCODER:
            k = 3
            r = 0
            c = 0
        else:
            (k, r, c) = BUTTON_ADDRESSES[address]

        print("[SERIAL] IN: %d:%d:%d (%d) = %d" %
              (k, r, c, address, value))
        sys.stdout.flush()

        for conn in connections:
            conn.sendall(b"%d:%d:%d=%d" % (k, r, c, value))


serialReadThread = threading.Thread(
    target=start_serial_read, name="Serial Thread")
serialReadThread.start()

ServerSocket.listen(5)


def threaded_client(connection):
    print("Client Thread Started")
    sys.stdout.flush()
    index = len(connections)
    connections.append(connection)

    while not killed:
        data = connection.recv(1024)
        if not data:
            break
        values = list(map(lambda x: int.from_bytes(bytes.fromhex(
            x.decode("utf-8")), 'big'), data.split(b',')))
        serial_write(values)

    del connections[index]
    connection.close()


clientThreads = []
try:
    while not killed:
        clientConnection, address = ServerSocket.accept()
        print('Connected to: ' + address[0] + ':' + str(address[1]))
        sys.stdout.flush()
        clientThread = threading.Thread(
            target=threaded_client, args=(clientConnection, ))
        clientThread.start()
        clientThreads.append(clientThread)
except KeyboardInterrupt:
    print("Aborting...")
    sys.stdout.flush()
    killed = True
    ServerSocket.close()

    for clientThread in clientThreads:
        clientThread.join()
    serialReadThread.join()
