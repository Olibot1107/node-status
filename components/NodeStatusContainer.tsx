import React, { useCallback, useEffect, useRef, useState } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import MessageBox from '@/components/MessageBox';
import http from '@/api/http';

interface NodeStatus {
    id: number;
    uuid: string;
    name: string;
    fqdn: string;
    scheme: string;
    daemon_port: number;
    location_short: string | null;
    location_long: string | null;
    maintenance_mode: boolean;
    status: 'online' | 'offline';
    checked_at: string | null;
    error: string | null;
}

const REFRESH_INTERVAL = 60_000;

const statusStyles: Record<NodeStatus['status'], string> = {
    online: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
    offline: 'text-rose-300 border-rose-500/40 bg-rose-500/10',
};

const formatCheckedAt = (value: string | null) => {
    if (!value) {
        return 'Unknown';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Unknown';
    }

    return date.toLocaleString();
};

export default () => {
    const [nodes, setNodes] = useState<NodeStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalError, setGlobalError] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const mounted = useRef(true);

    const loadNodes = useCallback(() => {
        setLoading(true);
        http.get<NodeStatus[]>('/extensions/nodestatus/status')
            .then((response) => {
                if (!mounted.current) {
                    return;
                }

                setNodes(response.data);
                setGlobalError('');
            })
            .catch(() => {
                if (!mounted.current) {
                    return;
                }

                setGlobalError('Unable to load node statuses right now.');
            })
            .finally(() => {
                if (!mounted.current) {
                    return;
                }

                setLoading(false);
                setLastUpdated(new Date());
            });
    }, []);

    useEffect(() => {
        mounted.current = true;
        loadNodes();
        const interval = window.setInterval(loadNodes, REFRESH_INTERVAL);
        return () => {
            mounted.current = false;
            window.clearInterval(interval);
        };
    }, [loadNodes]);

    return (
        <PageContentBlock title={'Node Status'}>
            {globalError && <MessageBox type={'error'}>{globalError}</MessageBox>}
            {loading && nodes.length === 0 ? (
                <Spinner centered size={Spinner.Size.LARGE} />
            ) : nodes.length === 0 ? (
                <p className={'text-sm text-neutral-400'}>
                    There are no nodes configured for this panel yet. Once a node is registered, it will appear
                    here with its current status.
                </p>
            ) : (
                <div className={'grid gap-4 mt-4 lg:grid-cols-2 xl:grid-cols-3'}>
                    {nodes.map((node) => (
                        <div
                            key={node.id}
                            className={'flex flex-col gap-3 p-5 border border-neutral-700 rounded-lg bg-neutral-900 shadow'}
                        >
                            <div className={'flex items-start justify-between gap-4'}>
                                <div>
                                    <p className={'text-lg font-semibold text-white'}>{node.name}</p>
                                    <p className={'text-xs text-neutral-400 uppercase tracking-wide'}>
                                        {node.location_long ?? node.location_short ?? 'Unknown location'}
                                    </p>
                                </div>
                                <span
                                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusStyles[node.status]}`}
                                >
                                    {node.status === 'online' ? 'Online' : 'Offline'}
                                </span>
                            </div>

                            <div className={'text-sm text-neutral-300 space-y-1'}>
                                <p>
                                    <span className={'font-semibold text-neutral-400'}>FQDN:</span> {node.fqdn}
                                </p>
                                <p>
                                    <span className={'font-semibold text-neutral-400'}>Daemon port:</span>{' '}
                                    {node.scheme.toUpperCase()} · {node.daemon_port}
                                </p>
                            </div>

                            {node.maintenance_mode && (
                                <p className={'text-xs text-amber-400'}>Node is currently in maintenance mode.</p>
                            )}

                            {node.error && node.status === 'offline' && (
                                <p className={'text-xs text-rose-200 break-words'}>Last error: {node.error}</p>
                            )}

                            <p className={'text-xs text-neutral-500'}>
                                Last checked: {formatCheckedAt(node.checked_at)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
            {lastUpdated && (
                <p className={'text-xs text-neutral-500 mt-4 text-right'}>
                    Refreshed at {lastUpdated.toLocaleTimeString()}
                </p>
            )}
        </PageContentBlock>
    );
};
