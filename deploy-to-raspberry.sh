#!/bin/bash

# Setup like: https://blog.r0b.io/post/minimal-rpi-kiosk/

if [ "$#" -ne 1 ]; then
    echo "Usage: ./build.sh <ssh-connection>"
    exit
fi

rm -rf app.tar.gz
cd app


echo "[BUILD] Starting Build of Main App"
meteor build ../
echo ""
echo ""
cd ..
echo "Build Done."
workingpath="/home/pi/"
scp -r app.tar.gz "$1":"$workingpath"
scp -r hardware/tally-server "$1":"$workingpath/lora"
scp -r hardware/serial-server "$1":"$workingpath/serial"
ssh -T $1 << EOF

echo "-------------------------------------------------"
echo "-------------------------------------------------"
echo "-------------------------------------------------"
echo ""
echo ""
echo "Start with install"
echo "Temp Upload Path: $workingpath"

mkdir -p /tmp/meteorinstall
cd /tmp/meteorinstall
tar -xf "$workingpath"app.tar.gz
cd bundle
(cd programs/server && npm install)

echo "Stopping Service (Might need your Password)"
sudo systemctl stop desk-server
sudo systemctl stop lora-server
sudo systemctl stop serial-server

rm -rf /opt/webapps/desk/bundle
rm -rf /opt/webapps/lora
mv /tmp/meteorinstall/bundle /opt/webapps/desk
mv /home/pi/lora /opt/webapps/lora

echo "Starting Service (Might need your Password)"
sudo systemctl start lora-server
sudo systemctl start serial-server
sudo systemctl start desk-server

EOF

