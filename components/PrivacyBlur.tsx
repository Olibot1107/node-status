import React, { useEffect, useMemo, useState } from 'react';
import http from '@/api/http';

const CONFIG_ROUTE = '/extensions/privacyblur/settings';
const MASK_CLASS = 'privacy-blur-plugin-mask';

const DEFAULT_SETTINGS: PrivacyBlurSettings = {
    blurEmails: true,
    blurIPv4: true,
    blurIPv6: false,
    blurUUID: true,
    blurConsole: true,
};

const EMAIL_PATTERN = '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}';
const IPV4_PATTERN = '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b';
const IPV6_PATTERN = '\\b(?:[0-9A-Fa-f]{1,4}:){2,7}[0-9A-Fa-f]{1,4}\\b';
const UUID_PATTERN = '\\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\b';
const CONSOLE_PATTERN = '\\b[a-z0-9._%+-]+@[A-Za-z0-9.-]+\\b';

interface PrivacyBlurSettings {
    blurEmails: boolean;
    blurIPv4: boolean;
    blurIPv6: boolean;
    blurUUID: boolean;
    blurConsole: boolean;
}

const buildPattern = (settings: PrivacyBlurSettings): RegExp | null => {
    const parts: string[] = [];

    if (settings.blurEmails) {
        parts.push(EMAIL_PATTERN);
    }
    if (settings.blurIPv4) {
        parts.push(IPV4_PATTERN);
    }
    if (settings.blurIPv6) {
        parts.push(IPV6_PATTERN);
    }
    if (settings.blurUUID) {
        parts.push(UUID_PATTERN);
    }
    if (settings.blurConsole) {
        parts.push(CONSOLE_PATTERN);
    }

    if (parts.length === 0) {
        return null;
    }

    return new RegExp(parts.join('|'), 'giu');
};

const shouldSkipElement = (element: Element | null) => {
    if (!element) {
        return true;
    }

    return Boolean(
        element.closest(
            'code, pre, textarea, input, button, select, option, script, style, svg, .' + MASK_CLASS
        )
    );
};

export default () => {
    const [settings, setSettings] = useState<PrivacyBlurSettings>(DEFAULT_SETTINGS);

    const maskPattern = useMemo(() => buildPattern(settings), [settings]);

    useEffect(() => {
        let mounted = true;

        http.get<{ data: Record<string, boolean> }>(CONFIG_ROUTE)
            .then((response) => {
                if (!mounted) {
                    return;
                }

                const payload = response.data.data ?? {};
                setSettings({
                    blurEmails: Boolean(payload.blur_emails ?? DEFAULT_SETTINGS.blurEmails),
                    blurIPv4: Boolean(payload.blur_ipv4 ?? DEFAULT_SETTINGS.blurIPv4),
                    blurIPv6: Boolean(payload.blur_ipv6 ?? DEFAULT_SETTINGS.blurIPv6),
                    blurUUID: Boolean(payload.blur_uuid ?? DEFAULT_SETTINGS.blurUUID),
                    blurConsole: Boolean(payload.blur_console ?? DEFAULT_SETTINGS.blurConsole),
                });
            })
            .catch(() => {
                if (!mounted) {
                    return;
                }

                setSettings(DEFAULT_SETTINGS);
            });

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!maskPattern || typeof document === 'undefined') {
            return;
        }

        const maskTextNode = (node: Text) => {
            const text = node.nodeValue;
            if (!text) {
                return;
            }

            maskPattern.lastIndex = 0;
            if (!maskPattern.test(text)) {
                return;
            }

            maskPattern.lastIndex = 0;
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let match: RegExpExecArray | null;

            while ((match = maskPattern.exec(text)) !== null) {
                const before = text.slice(lastIndex, match.index);
                if (before) {
                    fragment.appendChild(document.createTextNode(before));
                }

                const masked = document.createElement('span');
                masked.className = MASK_CLASS;
                masked.textContent = match[0];
                fragment.appendChild(masked);
                lastIndex = match.index + match[0].length;
            }

            const remainder = text.slice(lastIndex);
            if (remainder) {
                fragment.appendChild(document.createTextNode(remainder));
            }

            node.parentNode?.replaceChild(fragment, node);
        };

        const scanNode = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const parent = node.parentElement;
                if (parent && !shouldSkipElement(parent)) {
                    maskTextNode(node as Text);
                }

                return;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) {
                return;
            }

            const element = node as Element;
            if (shouldSkipElement(element)) {
                return;
            }

            element.childNodes.forEach((child) => scanNode(child));
        };

        const scanRoot = (root: Node | null) => {
            if (!root) {
                return;
            }

            scanNode(root);
        };

        const observer = new MutationObserver((records) => {
            records.forEach((record) => {
                record.addedNodes.forEach((node) => scanNode(node));
            });
        });

        const appRoot = document.querySelector('#app');
        scanRoot(appRoot);
        if (appRoot) {
            observer.observe(appRoot, { childList: true, subtree: true });
        }

        return () => {
            observer.disconnect();
        };
    }, [maskPattern]);

    return (
        <style>{`.${MASK_CLASS} { filter: blur(0.5rem); transition: filter 0.2s ease, color 0.2s ease; cursor: pointer; }
            .${MASK_CLASS}:hover { filter: blur(0); }`}</style>
    );
};
