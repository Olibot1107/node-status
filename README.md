# Node Status

Adds a panel extension that surfaces the health of every registered node right inside the account dashboard.

## What it does

- injects a new **Nodes** tab under `/account` so that administrators and staff can see the same view as their users.
- displays each node's name, location, FQDN, daemon port, maintenance state, and whether the Wings instance responds to `/v1/ping`.
- caches each node's last probe for 30 seconds so the panel does not hammer Wings every time someone opens the tab.
- refreshes automatically every 60 seconds while the page is open and shows the last time the data was updated.

## Requirements

The panel needs network access to every Wings node so that it can reach `scheme://fqdn:daemonListen/v1/ping`. You do not need to install any extra packages—the extension uses Laravel's HTTP client with `withoutVerifying()` so self-signed certificates are tolerated.

## Installation

1. Place this directory in `extensions/node-status`.
2. Run any Blueprint extension install script you normally use.
3. After the extension is active, look for the **Nodes** entry under **Account** in the Pterodactyl dashboard.

There are no migrations, database tables, or admin settings to configure.
