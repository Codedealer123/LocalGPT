import { writable } from 'svelte/store';

const isMainThread = typeof window !== 'undefined' && typeof document !== 'undefined';
const canUseSessionStorage = isMainThread && typeof sessionStorage !== 'undefined';
const canUseLocalStorage = isMainThread && typeof localStorage !== 'undefined';
const canUseWorkers = isMainThread && typeof Worker !== 'undefined';

function safeRead(storage, key) {
    try {
        return storage?.getItem(key) ?? null;
    } catch {
        return null;
    }
}

function safeWrite(storage, key, value) {
    try {
        if (value === null || value === undefined) {
            storage?.removeItem(key);
        } else {
            storage?.setItem(key, value);
        }
    } catch {
        // Ignore storage failures in restricted/private browsing modes.
    }
}

export const selectedChatId = writable(
    canUseSessionStorage ? safeRead(sessionStorage, "selectedChatId") || null : null
);
export const progress = writable({});
export const availableModels = writable([]);
export let currentModel = writable(
    canUseLocalStorage ? safeRead(localStorage, "currentModel") || null : null
);
export const aiWorker = canUseWorkers
    ? new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
    : null;

selectedChatId.subscribe((value) => {
    if (canUseSessionStorage) {
        safeWrite(sessionStorage, "selectedChatId", value);
    }
});

currentModel.subscribe((value) => {
    if (canUseLocalStorage) {
        safeWrite(localStorage, "currentModel", value);
    }
});

if (aiWorker) {
    aiWorker.addEventListener('message', (event) => {
        const { type, progress: report } = event.data ?? {};

        if (type === 'progress') {
            progress.set(report);
        }

        if (type === 'models') {
            availableModels.set(event.data.models ?? []);
        }
    });

    // Request models after the listener is attached so we do not miss
    // the worker's initial postMessage during startup races.
    aiWorker.postMessage({ type: 'requestModels' });
}
