# Time Tracker

Time Tracker is a Progressive Web App (PWA) for time tracking,
specifically recording your last time events and running multiple
stopwatches.

It stores data in a local database (PouchDB), even while offline,
and can do a live sync (bidirectional data replication) with a
remote database (CouchDB). This app has been dockerized, so you
can easily run it locally or on a server, and access it via your
favorite web browser or as a PWA from your phone's main screen.

## Running (out of the box)

```shell
docker run -p 8080:80 --name time-tracker ghcr.io/wojciechpolak/time-tracker
```

### Running with Docker Compose

```shell
docker compose up
```

## Building

```shell
./scripts/build-docker.sh
APP_IMAGE=wap/time-tracker docker compose up
```

## License

This project is licensed under the GNU General Public License v3.0.
See the [COPYING](COPYING) file for details.

### Icon Attribution

The icons used in this project are from the [OpenMoji](https://openmoji.org)
project and are licensed under the
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) license.
