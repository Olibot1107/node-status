import React, { useCallback, useEffect, useRef, useState } from 'react';
import http from '@/api/http';
import Button from '@/components/elements/Button';
import MessageBox from '@/components/MessageBox';
import Spinner from '@/components/elements/Spinner';

const API_ROUTE = '/extensions/customavatars/avatar';
const HINT_TYPES = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

export default () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadAvatar = useCallback(() => {
        setLoading(true);
        http.get<{ data: { avatar_url?: string | null } }>(API_ROUTE)
            .then((response) => {
                setAvatarUrl(response.data.data.avatar_url ?? '');
                setMessage(null);
            })
            .catch(() => {
                setMessage({ type: 'error', text: 'Unable to load your avatar information.' });
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadAvatar();
    }, [loadAvatar]);

    const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        setSaving(true);
        http.post(API_ROUTE, formData)
            .then(() => {
                setMessage({ type: 'success', text: 'Avatar uploaded. It may take a second to appear.' });
                loadAvatar();
            })
            .catch(() => {
                setMessage({ type: 'error', text: 'Upload failed. Try a different image or size.' });
            })
            .finally(() => {
                setSaving(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            });
    };

    const handleRemove = () => {
        setSaving(true);
        http.delete(API_ROUTE)
            .then(() => {
                setMessage({ type: 'success', text: 'Custom avatar removed. Gravatar will be used again.' });
                setAvatarUrl('');
            })
            .catch(() => {
                setMessage({ type: 'error', text: 'Could not remove the avatar.' });
            })
            .finally(() => setSaving(false));
    };

    return (
        <div className={'space-y-4'}>
            <p className={'text-sm text-neutral-400'}>
                Upload an image to replace the Gravatar that Pterodactyl shows across the panel. The file is stored
                inside the extension data directory and served directly to you, so no external services are needed.
            </p>

            {message && (
                <MessageBox type={message.type === 'success' ? 'success' : 'error'}>{message.text}</MessageBox>
            )}

            {loading ? (
                <Spinner size={Spinner.Size.SMALL} centered />
            ) : avatarUrl ? (
                <div className={'flex items-center gap-4'}>
                    <img
                        src={avatarUrl}
                        alt={'Custom avatar'}
                        className={'w-16 h-16 rounded-full border border-neutral-600'}
                    />
                    <div>
                        <p className={'text-sm text-white'}>A custom avatar is active.</p>
                        <Button isSecondary size={'small'} onClick={handleRemove} disabled={saving}>
                            Remove
                        </Button>
                    </div>
                </div>
            ) : (
                <p className={'text-sm text-neutral-500'}>
                    No file uploaded yet. Once you upload an image, it will replace Gravatar across the panel for your
                    account.
                </p>
            )}

            <div className={'flex items-center gap-4'}>
                <label className={'text-xs uppercase tracking-wide text-neutral-400'} htmlFor={'avatar_upload'}>
                    Choose an image
                </label>
                <input
                    id={'avatar_upload'}
                    ref={fileInputRef}
                    type={'file'}
                    accept={HINT_TYPES.map((type) => `.${type}`).join(',')}
                    onChange={handleUpload}
                />
            </div>

            <p className={'text-2xs text-neutral-500'}>
                Allowed types: {HINT_TYPES.join(', ')}. Max size: 5 MB.
            </p>
        </div>
    );
};
