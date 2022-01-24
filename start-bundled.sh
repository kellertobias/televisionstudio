#!/bin/bash
pwd
whoami
ls -lach
echo "Starting..."
PORT=3030 CONFIG=./data/devices.yml npm run start:prod