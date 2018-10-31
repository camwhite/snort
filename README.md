# Snort

*Sniff disectted packets to JSON*

### Requirements

1. tshark

```bash
# debian linux
sudo apt install tshark

# macos
brew install tshark
```
### Installation

`npm i -g snort`

### Usage

Flags

- `-i` the interface to sniff on (required)
- `-d` the sniff duration (required)
- `-k` absolute path to an ssl keylog file for encrypted sniffing (optional)

- `--monitor` sniff in monitor mode (optional)
- `-s` a wireless network ssid (required in monitor)
- `-p` a wpa2 password (required)

Examples

```bash
# Sniff https packets for 30 seconds on your localhost
snort -i lo -d 30 -k sslkeys.txt


# Sniff all http packets on an insecure network
snort -i wlp2s0 -d 30 --monitor -s Some\ Open\ Wifi\ Network
```

> launch firefox like `SSLKEYLOGFILE=sslkeys.txt firefox` to generate the keylog file
