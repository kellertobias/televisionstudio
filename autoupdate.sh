#!/bin/bash

LOCKFILE=../autoupdate-lockfile
LOCKED=$(cat $LOCKFILE)
[ "$LOCKED" == '1' ] && echo "Autoupdate Seems to be running. Aborting." && exit 0 || echo "Not Locked. Continue."
echo "1" > $LOCKFILE
git fetch > /dev/null
git diff --quiet HEAD origin/live -- autoupdate.sh || echo "Updater has Changed"
NPM_CHANGED=$(git diff --quiet HEAD origin/live -- package.json && echo 0 || echo 1)
CLIENT_CHANGED=$(git diff --quiet HEAD origin/live -- src/{shared,client}/ && echo 0 || echo 1)
SERVER_CHANGED=$(git diff --quiet HEAD origin/live -- src/{shared,server}/ && echo 0 || echo 1)
CONFIG_CHANGED=$(git diff --quiet HEAD origin/live -- data/ && echo 0 || echo 1)
echo "Changes in NPM: $NPM_CHANGED"
echo "Changes in CLIENT: $CLIENT_CHANGED"
echo "Changes in SERVER: $SERVER_CHANGED"
(git status | grep "Your branch is behind") && (
    echo "Git Changes Detected Pulling";
    git pull  > /dev/null;
    echo "Check what needs to be rebuilt";
    [ "$NPM_CHANGED" == '1' ] && (echo "NPM CHANGED. Update" && npm ci -D) || echo "NPM DID NOT CHANGE";
    ( [ "$NPM_CHANGED" == '1' ] || [ "$CLIENT_CHANGED" == '1' ]) && (echo "CLIENT CHANGED. Update" && npm run build-client) || echo "CLIENT DID NOT CHANGE";
    ( [ "$NPM_CHANGED" == '1' ] || [ "$SERVER_CHANGED" == '1' ]) && (echo "SERVER CHANGED. Update" && npm run build-server) || echo "SERVER DID NOT CHANGE";
    ( [ "$CONFIG_CHANGED" == '1' ] || [ "$NPM_CHANGED" == '1' ] || [ "$SERVER_CHANGED" == '1' ] || [ "$CLIENT_CHANGED" == '1' ]) && echo "At least one folder changed. Restarting Server" && systemctl restart homebase
)
echo "0" > $LOCKFILE

