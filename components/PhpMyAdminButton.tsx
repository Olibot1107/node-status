import React, { useEffect, useMemo, useState } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import MessageBox from '@/components/MessageBox';
import { LinkButton } from '@/components/elements/Button';
import { ServerDatabase } from '@/api/server/databases/getServerDatabases';

const CONFIG_ROUTE = '/extensions/nodestatus/config';

interface PhpMyAdminConfig {
    phpmyadmin_url: string;
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export default () => {
    const [config, setConfig] = useState<PhpMyAdminConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const databases = ServerContext.useStoreState((state) => state.databases.data ?? []);

    useEffect(() => {
        let isMounted = true;

        setLoading(true);
        setError('');

        http.get<PhpMyAdminConfig>(CONFIG_ROUTE)
            .then((response) => {
                if (!isMounted) {
                    return;
                }

                setConfig({
                    phpmyadmin_url: response.data.phpmyadmin_url ?? '',
                });
            })
            .catch(() => {
                if (!isMounted) {
                    return;
                }

                setError('Unable to load phpMyAdmin configuration.');
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const baseUrl = useMemo(() => {
        if (!config?.phpmyadmin_url) {
            return '';
        }

        return trimTrailingSlash(config.phpmyadmin_url);
    }, [config?.phpmyadmin_url]);

    const hasConfig = Boolean(baseUrl);

    const buildLink = (database: ServerDatabase) => {
        if (!hasConfig) {
            return '#';
        }

        const encodedName = encodeURIComponent(database.name);
        return `${baseUrl}?db=${encodedName}`;
    };

    return (
        <div className={'mt-8 px-6 py-5 border border-neutral-800 rounded-2xl bg-neutral-950'}>
            <div className={'flex items-start justify-between gap-4 flex-wrap'}>
                <div>
                    <p className={'text-lg font-semibold text-white'}>phpMyAdmin quick launch</p>
                    <p className={'text-sm text-neutral-400'}>
                        Open phpMyAdmin with one click for any database assigned to this server.
                    </p>
                </div>
                {hasConfig && (
                    <LinkButton
                        isSecondary
                        size={'small'}
                        href={baseUrl}
                        target={'_blank'}
                        rel={'noreferrer'}
                        className={'mt-2'}
                    >
                        Open phpMyAdmin
                    </LinkButton>
                )}
            </div>

            {loading ? (
                <div className={'mt-6 flex justify-center'}>
                    <Spinner size={Spinner.Size.SMALL} centered />
                </div>
            ) : error ? (
                <MessageBox type={'error'} className={'mt-6'}>
                    {error}
                </MessageBox>
            ) : !hasConfig ? (
                <MessageBox type={'info'} className={'mt-6'}>
                    Set your phpMyAdmin base URL in <code>extensions/nodestatus/data/config.php</code> so the
                    quick links can appear here.
                </MessageBox>
            ) : databases.length === 0 ? (
                <p className={'mt-6 text-sm text-neutral-400'}>
                    This server has no databases yet. Create one to reveal phpMyAdmin shortcuts.
                </p>
            ) : (
                <div className={'mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'}>
                    {databases.map((database) => (
                        <LinkButton
                            key={database.id}
                            isSecondary
                            size={'small'}
                            href={buildLink(database)}
                            target={'_blank'}
                            rel={'noreferrer'}
                        >
                            {`Open ${database.name}`}
                        </LinkButton>
                    ))}
                </div>
            )}
        </div>
    );
};
