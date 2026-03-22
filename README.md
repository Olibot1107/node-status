# Privatcy Blur

Hides emails, UUIDs, IPv4/IPv6 addresses, and console credentials across the Blueprint UI until someone hovers them so the panel keeps sensitive data obscured by default.

## What it does

- injects a tiny script on every page that wraps matching patterns in a blurred span.
- the mask clears when hovered, and you can still select or copy the text once the blur is lifted.
- admin settings let you toggle which patterns are hidden (email, IPv4/IPv6, UUID, console credentials).
- these settings are stored under `extensions/privacyblur/data/settings.php` and live-update the masking logic.

## Admin settings

Visit the extension’s admin page (Admin → Extensions → Privatcy Blur) and toggle whichever patterns you want to mask:

- **Mask email addresses** – hides every `name@example.tld` string.
- **Mask IPv4 numbers** – hides `192.0.2.1`‑style addresses, including ones shown in server cards.
- **Mask IPv6 numbers** – hides longer IPv6 segments.
- **Mask UUID strings** – masks any 36‑character UUIDs such as server identifiers.
- **Mask console credentials** – hides `user@host` strings that appear in consoles or tooltips.

Changes apply immediately, but refreshing the dashboard ensures rolling content is re-scanned.

## Installation

1. Place this directory into `extensions/privacyblur` (or your desired path).
2. Run the Blueprint extension install script you normally use.
3. Visit Admin → Extensions → Privatcy Blur to configure the patterns you want to blur.
4. Browse the panel—matching text is blurred until hovered.
