# phpMyAdmin Quick Launch

Adds phpMyAdmin quick launch buttons to each server's database page so you can jump straight into phpMyAdmin for any database.

## What it does

- renders a phpMyAdmin quick launch card below the database list on every server.
- shows one button for every database, each opening phpMyAdmin with `?db=<database>` pre-filled.
- reads the phpMyAdmin base URL from the bundled configuration file, so no panel rewrite is needed.

## Configuration

1. Open `extensions/nodestatus/data/config.php` (the path assumes the extension is installed into `extensions/nodestatus`).
2. Set the `phpmyadmin_url` value to your phpMyAdmin instance (for example `https://phpmyadmin.example.com/`).
3. Save the file and reload any server database page. The quick launch card will appear automatically whenever a URL exists.

## Installation

1. Place this directory in `extensions/nodestatus`.
2. Run the Blueprint extension install script that you normally use.
3. Configure the phpMyAdmin URL as described above.
4. Visit a server, open **Databases**, and the phpMyAdmin card will appear after the list with quick-link buttons.
