#!/usr/bin/expect -f

set timeout 30
set host "72.60.28.175"
set password "Bobby321&Gloria321Watkins?"
set prompt "# "

spawn ssh root@$host

expect {
    "yes/no" { 
        send "yes\r"
        exp_continue
    }
    "password:" { 
        send "$password\r" 
    }
}

expect $prompt

# Navigate to the project directory
send "cd /root/websites/events-stepperslife\r"
expect $prompt

# Check current status
send "pwd\r"
expect $prompt
send "ls -la\r"
expect $prompt

# Copy the built files from local to server
send "exit\r"
expect eof