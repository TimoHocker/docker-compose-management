# Changelog

## 1.2.0

- start containers in parallel to speed up startup
- fix: only read current state from docker when necessary

## 1.1.1

Added `interface_name` to `networks.json` to specify the interface name for the network.

## 1.1.0

Added `backup_include` to `volumes.json` to include only specific folders in the
backup.

## 1.0.0

Initial release
