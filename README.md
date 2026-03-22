# Custom Avatars

Replace the default Gravatar with a custom profile picture that users upload directly through the panel.

## What it does

- exposes a new account settings card so the current user can upload or remove a profile picture.
- stores the image as a base64 blob inside the `custom_avatars` database table and serves it via a private API route so no external SSL/Gravatar calls are needed.
- injects a small script that replaces any `secure.gravatar.com/avatar` image with the uploaded file for the uploader.

## Application API

1. Configure your Application API key in `extensions/customavatars/data/api.php` under the `keys` array (replace the placeholder).
2. Use the same key when calling `/extensions/customavatars/api/avatar/{userId}` (Authorization header `Bearer <key>`) from the Pterodactyl Application API or any other HTTP client.
3. Submit either a multipart `avatar` file or a `base64` string (`data:image/png;base64,...` or raw base64). The endpoint stores the base64 blob and will immediately replace that user’s panel avatar. You can delete the custom avatar with `DELETE /extensions/customavatars/api/avatar/{userId}` to revert to Gravatar.

Example upload via the Application API (replace placeholders):

```
curl -X POST https://panel.example.com/extensions/customavatars/api/avatar/12345 \
  -H "Authorization: Bearer YOUR_KEY" \
  -F avatar=@/path/to/photo.png
```

Another option (base64 payload):

```
curl -X POST https://panel.example.com/extensions/customavatars/api/avatar/12345 \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"base64":"data:image/png;base64,...."}'
```

## Installation

1. Place this directory into `extensions/customavatars`.
2. Run your usual Blueprint extension install command (Blueprint will automatically run the new migration to create `custom_avatars`).
3. Visit **Account** → **Settings** and use the Custom Avatars card to upload an image (or call the new API to push avatars for other users).

## Notes

- Avatar blobs are stored in the `custom_avatars` database table (created by the included migration) along with MIME metadata.
- The avatar replacement only affects the uploading user’s avatar inside the panel; it does not change Gravatar for other people.
- Files are served via `/extensions/customavatars/avatar/file`, and the upload endpoint validates the image types allowed.
