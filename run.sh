export CONFIGLOCATION="$(pwd)/config.yaml"
export SETTINGS_PATH="$(pwd)/config"
export SHOWDATA_PATH="$(pwd)/config/showfiles"
# export DEBUG=obs-websocket-js:*
python3 serialproxy.py
(cd app && meteor)