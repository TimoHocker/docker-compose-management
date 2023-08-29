# Docker-Compose Management

Open docker-compose script and example library

## Setup

Each service has its own folder under `services/` all necessary docker-compose
files and configs should be stored there.

> Docker-compose files have to be named `docker-compose.yml` and be at the top
> level of each individual service folder.

All services are registered under `config/` including their networks and
volumes.

In `groups.json` the services can be divided into functional groups and an order
for startup can be defined. At Shutdown the order is reversed.

The file `passive.json` can be used to deactivate services, those will not be
started automatically, but they can be started manually by running
`docker-compose up -d` in the service's folder

Networks can be defined in `networks.json`. Available options are `internal` to
set docker's network internal flag and `subnet` to define a specific subnet for
a network.

Volume settings are placed in `volumes.json`. By default all volumes in this
file are added to the backup filter. To prevent them from getting backed up, set
the option `backup` to false. Additionally single folders can be excluded from
the backup using the `backup_exclude` option.

## Scripts / Commands

### init.sh

The main script is `init.sh`. By simply running this script without any
arguments, all services will be started.

Available Arguments:

1. Action: `UP`/`DOWN`/`NONE`

Decides if services are started (`UP`), stopped (`DOWN`) or no action is run
(`NONE`). `UP` is the default action and doesn't have to be included in the
command.

2. Pulling images: `PULL`

By adding the option `PULL`, all images are pulled before the action is run.

3. Including or excluding passive services `ALL`/`ACTIVE`

By adding `ALL` to a `UP` or `NONE` operation, all passive services will be
included. A `DOWN` operation includes passive services by default, here `ACTIVE`
can be used to exclude them.

Examples:

1. starting only active services: `./init.sh UP`
2. starting all services: `./init.sh UP ALL`
3. stopping all services: `./init.sh DOWN`
4. stopping only active services: `./init.sh DOWN ACTIVE`
5. pulling all images: `./init.sh NONE PULL`
6. pulling and starting all active services: `./init.sh UP PULL`

### group_init.sh

The script group_init.sh behaves exactly as `init.sh`, but only acts on a single
group. To use it you have to specify a group name as first argument.

Examples:

1. starting a single group: `./group_init.sh main UP`

### create_filter.sh

This script creates a file (`filter`) to be used with `rsync` to backup all
volumes.

### updates.sh

This script pulls all images and restarts the services.

### struct_init.sh

This script creates all necessary networks and volumes. It is run automatically
by the other init scripts.
