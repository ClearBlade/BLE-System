#!/bin/bash
if [ "$EUID" -ne 0 ]
  then 
  	echo "---------Permissions Error---------"
  	echo "STOPPING: Please run as root or sudo"
  	echo "-----------------------------------"
  exit
fi

source "./adapterconfig.txt"

echo "------Turning on Bluetooth"

hciconfig hci0 down
hciconfig hci0 up

echo "------Starting pythonScanner"

/etc/init.d/$ADAPTERSERVICENAME start
