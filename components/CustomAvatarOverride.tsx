import React, { useEffect, useState } from 'react';
import http from '@/api/http';

const API_ROUTE = '/extensions/customavatars/avatar';

export default () => {
    const [avatarUrl, setAvatarUrl] = useState<string>('');

    useEffect(() => {
        let mounted = true;

        http.get<{ data: { avatar_url?: string | null } }>(API_ROUTE)
            .then((response) => {
                if (!mounted) {
                    return;
                }

                setAvatarUrl(response.data.data.avatar_url ?? '');
            })
            .catch(() => {
                if (mounted) {
                    setAvatarUrl('');
                }
            });

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!avatarUrl || typeof document === 'undefined') {
            return;
        }

        const replaceAvatars = () => {
            const root = document.querySelector('#app') ?? document.body;
            root.querySelectorAll<HTMLImageElement>('img[src*="gravatar.com/avatar"]').forEach((img) => {
                if (img.dataset.customAvatarApplied === '1') {
                    return;
                }

                img.dataset.customAvatarApplied = '1';
                img.src = avatarUrl;
            });
        };

        replaceAvatars();

        const rootObserver = document.querySelector('#app') ?? document.body;
        const observer = new MutationObserver(() => {
            replaceAvatars();
        });

        observer.observe(rootObserver, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [avatarUrl]);

    return null;
};
