#!/bin/bash

# Setup like: https://blog.r0b.io/post/minimal-rpi-kiosk/

if [ "$#" -ne 1 ]; then
    echo "Usage: ./build.sh <ssh-connection>"
    exit
fi
PORT=9922
workingpath="/home/pi/desk-bundle"

echo "————————————————————————————————————————————————————————————————————————"
echo "Create Remote Directory"
ssh -p $PORT -T $1 << EOF
cd $workingpath;
cd ..
rm -rf desk-bundle
mkdir -p $workingpath/desk/bundle
EOF

echo ""
echo ""
echo "————————————————————————————————————————————————————————————————————————"
echo "Starting Copy"
sleep 1


scp -P $PORT -r dist/ "$1":"$workingpath/desk/bundle/dist"
scp -P $PORT -r assets/ "$1":"$workingpath/desk/bundle/assets"
scp -P $PORT -r views/ "$1":"$workingpath/desk/bundle/views"
scp -P $PORT -r package.json/ "$1":"$workingpath/desk/bundle/package.json"
scp -P $PORT -r .nvmrc/ "$1":"$workingpath/desk/bundle/.nvmrc"
scp -P $PORT -r index.js/ "$1":"$workingpath/desk/bundle/index.js"
scp -P $PORT -r webpack.config.ts/ "$1":"$workingpath/desk/bundle/webpack.config.ts"
scp -P $PORT -r services/tally-lora-server "$1":"$workingpath/lora"
scp -P $PORT -r services/serial-server "$1":"$workingpath/serial"

echo ""
echo ""
echo "————————————————————————————————————————————————————————————————————————"
echo "Starting Remote Install"
sleep 1

ssh -p $PORT -T $1 << EOF

echo ""
echo ""
echo "————————————————————————————————————————————————————————————————————————"
echo "Temp Upload Path: $workingpath"
cd $workingpath
echo "Node Version: $(node -v)"
echo "NPM Version: $(npm -v)"
echo "Doing NPM Install in $(pwd)"
(cd desk/bundle && NODE_ENV=production npm install)


echo ""
echo ""
echo "————————————————————————————————————————————————————————————————————————"
echo "Stopping Service (Might need your Password)"
sudo systemctl stop desk-server
sudo systemctl stop lora-server
sudo systemctl stop serial-server

echo ""
echo ""
echo "————————————————————————————————————————————————————————————————————————"
echo "Removing old builds"
rm -rf /opt/webapps/desk/bundle
rm -rf /opt/webapps/serial
rm -rf /opt/webapps/lora

echo "Moving new Builds"
mv $workingpath/desk/bundle /opt/webapps/desk
mv $workingpath/lora /opt/webapps/lora
mv $workingpath/serial /opt/webapps/serial

cd /opt/webapps/desk/bundle
ln -s ../config config

echo ""
echo ""
echo "————————————————————————————————————————————————————————————————————————"
echo "Starting Service (Might need your Password)"
sudo systemctl start lora-server
sudo systemctl start serial-server
sudo systemctl start desk-server

EOF

