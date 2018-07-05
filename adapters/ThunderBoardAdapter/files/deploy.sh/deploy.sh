#!/bin/bash
if [ "$EUID" -ne 0 ]
  then 
  	echo "---------Permissions Error---------"
  	echo "STOPPING: Please run as root or sudo"
  	echo "-----------------------------------"
  exit
fi

source "./adapterconfig.txt"

echo "Adapter Root Folder: $ADAPTERROOTFOLDER"
echo "Adapter Service Name: $ADAPTERSERVICENAME"
echo "Initd Path: $INITDPATH"
echo "Python File: $PYTHONFILE"
echo "Python Bin: $PYTHONBIN"

echo "------Installing Prerequisites"

sudo apt-get -y update
sudo apt-get -y install libglib2.0-dev
sudo apt-get -y install python-pip
[ -d $LOGDIR ] || mkdir -p $LOGDIR
#pip install --upgrade pip
pip install bluepy
pip install clearblade

cat >"$INITDPATH/$ADAPTERSERVICENAME" <<EOF
#!/bin/sh
### BEGIN INIT INFO
# Provides:          bleAdapter
# Required-Start:    \$remote_fs \$syslog
# Required-Stop:     \$remote_fs \$syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Start daemon at boot time
# Description:       Enable service provided by daemon.
### END INIT INFO
name="$PYTHONFILE"
dir="$ADAPTERROOTFOLDER"
cmd="$PYTHONBIN ./pythonScanner.py"
user=""

log="/media/userdata/scanner.log"
echo "hey running init.d/ThunderboardService \$1" >> "\$log" 
is_running() {
    pgrep python > /dev/null 2>&1
}

case "\$1" in
    start)
    if is_running; then
        echo "Already started"
    else
        echo "Starting \$name"
        cd "\$dir"
        if [ -z "\$user" ]; then
            \$cmd >> "\$log"  &
        else
            \$cmd >> "\$log"  &
        fi
        if ! is_running; then
            echo "Unable to start, see \$log"
            exit 1
        fi
    fi
    ;;
    stop)
    if is_running; then
        echo -n "Stopping \$name.."
        kill \$(pgrep python)
        for i in 1 2 3 4 5 6 7 8 9 10
        # for i in 'seq 10'
        do
            if ! is_running; then
                break
            fi

            echo -n "."
            sleep 1
        done

        if is_running; then
            echo "Not stopped; may still be shutting down or shutdown may have failed"
            exit 1
        else
            echo "Stopped"
        fi
    else
        echo "Not running"
    fi
    ;;
    restart)
    \$0 stop
    if is_running; then
        echo "Unable to stop, will not attempt to start"
        exit 1
    fi
    \$0 start
    ;;
    status)
    if is_running; then
        echo "Running \$(pgrep \$name)"
    else
        echo "Stopped"
        exit 1
    fi
    ;;
    *)
    echo "Usage: \$0 {start|stop|restart|status}"
    exit 1
    ;;
esac

exit 0
EOF

if [ "$?" -ne 0 ]; then
echo "cat into service name failed with code: $?"
exit 1
fi

chmod +x "$INITDPATH/$ADAPTERSERVICENAME"

#Enable the adapter to start on reboot Note: remove this if you want to manually maintain the adapter
echo "------Enabling Startup on Reboot"
#TODO Install with init.d
update-rc.d $ADAPTERSERVICENAME defaults

echo "------Successfully Deployed!"

