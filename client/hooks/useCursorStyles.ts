/**
 * Helper to dynamically inject CSS for remote cursors based on Yjs clientIDs.
 * This ensures each user's cursor has their unique color.
 */
export const setupCursorStyles = (awareness: any, myClientId: number) => {
    if (!awareness) return () => {};

    const styleTagId = "yjs-cursor-styles";
    
    const injectCursorCSS = () => {
        let css = `
            .yRemoteSelection { opacity: 0.35; }
            .yRemoteSelectionHead {
                position: absolute;
                border-left: 2px solid;
                height: 100%;
                box-sizing: border-box;
                z-index: 10;
            }
            .yRemoteSelectionHead::after {
                position: absolute;
                content: attr(data-user-name);
                font-size: 10px;
                font-weight: bold;
                padding: 1px 5px;
                top: -16px;
                left: -2px;
                border-radius: 4px 4px 4px 0;
                pointer-events: none;
                white-space: nowrap;
                z-index: 100;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                color: #000;
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
            }
            /* Show the badge when the cursor is active or hovered */
            .yRemoteSelectionHead.is-active::after,
            .yRemoteSelectionHead:hover::after {
                opacity: 1;
            }
        `;

        awareness.getStates().forEach((state: any, clientID: number) => {
            if (clientID !== myClientId && state?.user?.color) {
                const c = state.user.color;
                css += `
                    .yRemoteSelection-${clientID} {
                        background-color: ${c}55 !important;
                    }
                    .yRemoteSelectionHead-${clientID} {
                        border-color: ${c} !important;
                    }
                    .yRemoteSelectionHead-${clientID}::after {
                        background-color: ${c} !important;
                    }
                `;
            }
        });

        let tag = document.getElementById(styleTagId);
        if (!tag) {
            tag = document.createElement("style");
            tag.id = styleTagId;
            document.head.appendChild(tag);
        }
        tag.innerHTML = css;
    };

    awareness.on("change", injectCursorCSS);
    injectCursorCSS();

    return () => {
        awareness.off("change", injectCursorCSS);
        const tag = document.getElementById(styleTagId);
        if (tag) tag.remove();
    };
};
