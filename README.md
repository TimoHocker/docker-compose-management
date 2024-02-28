# Docker-Compose Management

Version: 1.1.0

Open docker-compose management cli

## Setup

Installation: `npm i -g @sapphirecode/dcm`

Each service has its own folder under `services/` all necessary docker-compose
files and configs should be stored there.

> Docker-compose files have to be named `docker-compose.yml` and be at the top
> level of each individual service folder.

In `dependencies.json` all dependencies of a service can be defined. The start
and stop order of services is determined by the dependencies.

The file `passive.json` can be used to deactivate services, those will not be
started automatically, but they can be started manually by running
`docker-compose up -d` in the service's folder or by including the flag
`--include-passive` when using the cli.

Networks can be defined in `networks.json`. Available options are `internal` to
set docker's network internal flag and `subnet` to define a specific subnet for
a network.

Volume settings are placed in `volumes.json`. By default all volumes in this
file are added to the backup filter. To prevent them from getting backed up, set
the option `backup` to false. Additionally single folders can be excluded from
the backup using the `backup_exclude` option. Instead of backing up the whole
volume, you can use `backup_include` to include only specific folders.

## Commands

Global Options:

- `--delay=<seconds>`: Delay before executing the command

1. Pulling images: `pull`

This command simply pulls all images and exits.

2. Starting services: `up`

This command starts all services in the correct order and creates the necessary
networks and volumes if they don't already exist. Available options are:
`--pull` to pull images before starting the services and `--include-passive` to
include passive services.

3. Stopping services: `down`

Stops all services including the passive ones.

4. Restarting services: `restart`

Restarts all services, has the same effect as running `down` and `up`
separately.

5. Creating a backup filter: `create_filter`

Creates a filter file for rsync to create a backup of all configured volumes.
