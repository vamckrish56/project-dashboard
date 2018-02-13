#!/bin/bash

cd ..
TC_HOME=`pwd`
#result=`git pull`

if [ -f chromium.pid ]; then
	pid=`cat chromium.pid`
	cmd=`readlink /proc/${pid}/exe | awk 'BEGIN{FS="/"}{print $NF}'`
fi

#if [ "$cmd" != "chromium-browser" ]; then
#	echo "Starting browser..."
#	export DISPLAY=":0"
#	/usr/lib/chromium-browser/chromium-browser --noerrdialogs --disable-session-crashed-bubble --disable-infobars --kiosk file://${TC_HOME}/index.html?
#	echo $! > chromium.pid
#fi
if [ "$cmd" != "chromium-browser" ]; then
	echo "Starting browser..."
	export DISPLAY=":0"
	/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --noerrdialogs --disable-session-crashed-bubble --disable-infobars --kiosk file://${TC_HOME}/index.html?suite=UDS-DFW &
	echo $! > chromium.pid
fi

if [ "$result" = "Already up-to-date." ]; then
	echo "No changes - skipping refresh"
else
	echo "Refreshing browser..."
	export DISPLAY=":0"
	xdotool key --clearmodifiers ctrl+r
fi
