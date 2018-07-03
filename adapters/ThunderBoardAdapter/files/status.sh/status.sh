#!/bin/bash
if [ "$EUID" -ne 0 ]
  then 
  	echo "---------Permissions Error---------"
  	echo "STOPPING: Please run as root or sudo"
  	echo "-----------------------------------"
  exit
fi

source "./adapterconfig.txt"

VAR=$(ps aux | grep python | grep -v grep)

if [[ $VAR ]]; then
        STATUS="Running"
else
        STATUS="Stopped"
fi

echo $STATUS
