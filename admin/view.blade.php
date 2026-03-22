<div class="row">
    <div class="col-xs-12 col-sm-10 col-sm-offset-1">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">Privatcy Blur settings</h3>
            </div>
            <div class="box-body">
                <p>
                    Choose what kinds of data should stay blurred until hovered. Each toggle applies instantly, but
                    refreshing the dashboard will ensure everything is masked with the new setting.
                </p>
                <div id="privacy-blur-settings">
                    <div class="privacy-section">
                        <h4>Pattern masks</h4>
                        <div class="privacy-row">
                            <span>Mask email addresses</span>
                            <label class="privacy-toggle">
                                <input type="checkbox" data-field="blur_emails" />
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="privacy-row">
                            <span>Mask IPv4 numbers</span>
                            <label class="privacy-toggle">
                                <input type="checkbox" data-field="blur_ipv4" />
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="privacy-row">
                            <span>Mask IPv6 numbers</span>
                            <label class="privacy-toggle">
                                <input type="checkbox" data-field="blur_ipv6" />
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="privacy-row">
                            <span>Mask UUID strings</span>
                            <label class="privacy-toggle">
                                <input type="checkbox" data-field="blur_uuid" />
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="privacy-row">
                            <span>Mask console credentials (user@host)</span>
                            <label class="privacy-toggle">
                                <input type="checkbox" data-field="blur_console" />
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                    <p id="privacy-blur-status" class="text-muted">Loading settings…</p>
                </div>
            </div>
        </div>
    </div>
</div>
<style>
    .privacy-section {
        border-top: 1px solid #e1e1e1;
        padding-top: 1rem;
        margin-top: 1rem;
    }

    .privacy-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .privacy-toggle {
        position: relative;
        display: inline-block;
        width: 48px;
        height: 24px;
    }

    .privacy-toggle input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .privacy-toggle .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: 0.2s;
        border-radius: 999px;
    }

    .privacy-toggle .slider::before {
        position: absolute;
        content: '';
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.2s;
        border-radius: 50%;
    }

    .privacy-toggle input:checked + .slider {
        background-color: #22d3ee;
    }

    .privacy-toggle input:checked + .slider::before {
        transform: translateX(24px);
    }
</style>
<script>
    (function () {
        const endpoint = '/extensions/privacyblur/settings';
        const inputs = document.querySelectorAll('[data-field]');
        const statusElement = document.getElementById('privacy-blur-status');
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

        const setStatus = (message, type) => {
            if (!statusElement) {
                return;
            }

            statusElement.textContent = message;
            statusElement.className = type ? `text-${type}` : 'text-muted';
        };

        const applySettings = (payload) => {
            inputs.forEach((input) => {
                const key = input.getAttribute('data-field');
                if (!key) {
                    return;
                }

                input.checked = Boolean(payload[key]);
            });
        };

        const loadSettings = () => {
            setStatus('Loading settings…');

            fetch(endpoint, {
                credentials: 'same-origin',
            })
                .then((response) => response.json())
                .then((body) => {
                    if (body && body.data) {
                        applySettings(body.data);
                        setStatus('Settings loaded.', 'success');
                    } else {
                        setStatus('Unexpected response while loading settings.', 'danger');
                    }
                })
                .catch(() => setStatus('Unable to load settings.', 'danger'));
        };

        const saveSettings = () => {
            const payload = {};
            inputs.forEach((input) => {
                const key = input.getAttribute('data-field');
                if (!key) {
                    return;
                }

                payload[key] = input.checked;
            });

            setStatus('Saving settings…');

            const headers = {
                'Content-Type': 'application/json',
            };

            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
            }

            fetch(endpoint, {
                method: 'POST',
                credentials: 'same-origin',
                headers,
                body: JSON.stringify(payload),
            })
                .then((response) => response.json())
                .then((body) => {
                    if (body && body.data) {
                        setStatus('Settings saved.', 'success');
                    } else {
                        setStatus('Unable to persist settings.', 'danger');
                    }
                })
                .catch(() => setStatus('Unable to persist settings.', 'danger'));
        };

        inputs.forEach((input) => {
            input.addEventListener('change', () => saveSettings());
        });

        loadSettings();
    })();
</script>
