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
export const modelsLoaded = writable(false);
export let currentModel = writable(
    canUseLocalStorage ? safeRead(localStorage, "currentModel") || null : null
);
export let aiWorker = null;

let workerBootPromise = null;

function attachWorkerListeners(worker) {
    worker.addEventListener('message', (event) => {
        const { type, progress: report } = event.data ?? {};

        if (type === 'progress') {
            progress.set(report);
        }

        if (type === 'models') {
            modelsLoaded.set(true);
            availableModels.set(event.data.models ?? []);
        }
    });
}

export async function ensureAIWorker() {
    if (!canUseWorkers) {
        return null;
    }

    if (aiWorker) {
        return aiWorker;
    }

    if (!workerBootPromise) {
        workerBootPromise = Promise.resolve().then(() => {
            const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
            attachWorkerListeners(worker);
            worker.postMessage({ type: 'requestModels' });
            aiWorker = worker;
            return worker;
        });
    }

    try {
        return await workerBootPromise;
    } finally {
        workerBootPromise = null;
    }
}

export function warmAIWorker() {
    void ensureAIWorker();
}

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
