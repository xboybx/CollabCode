/**
 * Watches for Yjs-Monaco cursors being added to the DOM.
 */
export const setupCursorObserver = (awareness: any, myClientId: number) => {
    if (!awareness) return () => {};

    const activeTimers = new Map<number, NodeJS.Timeout>();
    const lastSelections = new Map<number, string>(); // Store selection as stringified JSON

    /**
     * Stamps the user name from awareness onto a specific cursor element.
     */
    const stampName = (head: HTMLElement, clientId: number) => {
        const state = awareness.getStates().get(clientId);
        if (state?.user?.name) {
            head.setAttribute('data-user-name', state.user.name);
        } else {
            // Fallback if no specific state was found for this clientId yet
            head.setAttribute('data-user-name', "User");
        }
    };

    /**
     * Shows the name tag for a specific clientId for a limited time.
     */
    const triggerActivity = (clientId: number) => {
        if (clientId === myClientId) return;

        const head = document.querySelector(`.yRemoteSelectionHead-${clientId}`) as HTMLElement;
        if (head) {
            // Always refresh the name tag to ensure it's up to date
            stampName(head, clientId);

            // Show it!
            head.classList.add('is-active');

            // Reset the "hide" timer
            if (activeTimers.has(clientId)) clearTimeout(activeTimers.get(clientId));
            const timeout = setTimeout(() => {
                head.classList.remove('is-active');
                activeTimers.delete(clientId);
            }, 3000);
            
            activeTimers.set(clientId, timeout);
        }
    };

    // 1. Observer: Stamps names whenever Monaco inserts/refreshes elements in DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node instanceof HTMLElement) {
                    const heads = node.querySelectorAll('.yRemoteSelectionHead');
                    heads.forEach((headElement) => {
                        const head = headElement as HTMLElement;
                        const classList = Array.from(head.classList);
                        const clientIdClass = classList.find(c => c.startsWith('yRemoteSelectionHead-'));
                        if (clientIdClass) {
                            const clientId = parseInt(clientIdClass.split('-')[1]);
                            if (clientId === myClientId) return;
                            stampName(head, clientId);
                        }
                    });
                }
            });
        });
    });

    // 2. Awareness Listener: Triggers the "pop up" ONLY if selection changed
    const handleAwarenessUpdate = ({ updated, added }: { updated: number[], added: number[] }) => {
        [...updated, ...added].forEach(clientId => {
            if (clientId === myClientId) return;

            const state = awareness.getStates().get(clientId);
            if (!state || !state.selection) return;

            // Track movement
            const currentSelection = JSON.stringify(state.selection);
            const lastSelection = lastSelections.get(clientId);

            if (currentSelection !== lastSelection) {
                lastSelections.set(clientId, currentSelection);
                triggerActivity(clientId);
            }
        });
    };

    awareness.on('update', handleAwarenessUpdate);

    // Initial Observation setup
    const startObserving = () => {
        const editorNode = document.querySelector('.monaco-editor');
        if (editorNode) {
            observer.observe(editorNode, { childList: true, subtree: true });
            
            // Scan for any existing cursors that might have missed the first mutation
            document.querySelectorAll('.yRemoteSelectionHead').forEach((headElement) => {
                const head = headElement as HTMLElement;
                const clientIdClass = Array.from(head.classList).find(c => c.startsWith('yRemoteSelectionHead-'));
                if (clientIdClass) {
                    const clientId = parseInt(clientIdClass.split('-')[1]);
                    if (clientId !== myClientId) stampName(head, clientId);
                }
            });

            return true;
        }
        return false;
    };

    let intervalId: any;
    if (!startObserving()) {
        intervalId = setInterval(() => {
            if (startObserving()) clearInterval(intervalId);
        }, 500);
    }

    return () => {
        if (intervalId) clearInterval(intervalId);
        awareness.off('update', handleAwarenessUpdate);
        activeTimers.forEach(clearTimeout);
        observer.disconnect();
    };
};
