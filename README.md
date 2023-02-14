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
docker-compose up
```

## Building

```shell
./scripts/build-docker.sh
APP_IMAGE=wap/time-tracker docker-compose up
```
