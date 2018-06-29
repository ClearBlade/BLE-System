#!/bin/bash
if [ "$EUID" -ne 0 ]
  then 
  	echo "---------Permissions Error---------"
  	echo "STOPPING: Please run as root or sudo"
  	echo "-----------------------------------"
  exit
fi

#SCRIPTDIR="$( cd "$(dirname "$0")" ; pwd -P )"
#CONFIGFILENAME="adapterconfig.txt"
#source "$SCRIPTDIR/$CONFIGFILENAME"

source "./adapterconfig.txt"

#Clean up any old adapter stuff
echo "------Cleaning Up Old Adapter Configurations"
sudo systemctl stop $ADAPTERSERVICENAME
sudo systemctl disable $ADAPTERSERVICENAME
sudo rm $SYSTEMDPATH/$ADAPTERSERVICENAME
sudo rm -rf $ADAPTERFULLPATH

echo "------Reloading daemon"
sudo systemctl daemon-reload
