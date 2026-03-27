import { useState, useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";

// ============================================================
// useWebRTC Hook
// This hook is the entire brain of the video call feature.
// It runs the moment the user clicks the Video button and
// the VideoBubble component opens.
//
// It receives two things from the parent component:
//   - socket: the live socket connection to the Express server
//   - roomId: the ID of the room the user is currently in
// ============================================================

export const useWebRTC = (socket: Socket | null, roomId: string, callerName?: string) => {

    // ----------------------------------------------------------
    // STATE 1: localstreams
    // Holds the raw camera + microphone data coming from THIS
    // user's hardware. Starts as null (no camera yet).
    // Once permission is granted, it becomes a MediaStream object
    // which is a container of video and audio bytes from the webcam.
    // ----------------------------------------------------------
    const [localstreams, setLocalstreams] = useState<MediaStream | null>(null)

    // ----------------------------------------------------------
    // STATE 2: remotestreams
    // A dictionary that holds the video data from OTHER users.
    //   Key   = their socket.id  (e.g. "abc123")
    //   Value = their MediaStream (their live camera bytes)
    //
    // Example when 2 remote users are connected:
    //   {
    //     "abc123": MediaStream,   ← User 2's camera
    //     "xyz789": MediaStream    ← User 3's camera
    //   }
    //
    // The VideoBubble component maps over this dictionary and
    // renders one <video> element for each entry.
    // ----------------------------------------------------------
    const [remotestreams, setRemotestreams] = useState<Record<string, MediaStream>>({})

    // ----------------------------------------------------------
    // STATE 3: remoteCameraStates
    // Tracks whether each remote user's camera is on or off.
    // Key = their socket.id, Value = true means camera is OFF.
    // When they toggle their camera, they send a socket signal,
    // we receive it and update this dictionary.
    // VideoBubble reads this to decide: show avatar or <video>.
    // ----------------------------------------------------------
    const [remoteCameraStates, setRemoteCameraStates] = useState<Record<string, boolean>>({});


    // ----------------------------------------------------------
    // REF: peers
    // Stores all the active RTCPeerConnection objects.
    // One RTCPeerConnection = one background WebRTC connection
    // to one specific other user.
    //
    // We use useRef instead of useState here because:
    //   - useState triggers a React re-render every time you
    //     update it. A re-render would wipe the hook state and
    //     destroy all existing connections every time a new
    //     person joined video.
    //   - useRef stores data permanently in memory without
    //     ever triggering a re-render. The connections survive
    //     across re-renders safely.
    // ----------------------------------------------------------
    const peers = useRef<Record<string, RTCPeerConnection>>({});


    // ----------------------------------------------------------
    // EFFECT 1: Get Camera & Microphone Permission
    //
    // useEffect with [] runs exactly ONCE: the moment the
    // VideoBubble component opens (mounts).
    //
    // It does two things:
    //   1. Calls startMedia() to request hardware access.
    //   2. Returns a cleanup function that runs when the
    //      VideoBubble is closed (unmounts). The cleanup
    //      physically turns off the camera hardware so the
    //      green camera light goes off on the user's device.
    // ----------------------------------------------------------
    useEffect(() => {

        const startMedia = async () => {
            try {
                console.log("[🎥 MEDIA] Asking user for Camera & Mic permissions...");

                // navigator.mediaDevices.getUserMedia is a native browser function.
                // It pops up the "Allow Camera" dialog.
                // If the user clicks Allow, it returns a MediaStream object
                // containing the raw video and audio bytes from the webcam and mic.
                // If the user clicks Block, it throws an error and we go to catch.
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                })

                console.log("[✅ MEDIA] Success! User granted permissions. Stream ID:", stream.id);

                // Save the stream in React state so VideoBubble can
                // render it inside a <video> element.
                setLocalstreams(stream)

            } catch (err) {
                console.error("[❌ MEDIA] Failed to get Camera/Mic! Did you block permissions?", err)
            }
        }

        startMedia()

        // ----------------------------------------------------------
        // ----------------------------------------------------------
        // CLEANUP FUNCTION
        // React calls this automatically when VideoBubble is closed.
        //
        // We do TWO things here:
        //
        // 1. Stop every hardware track (camera light goes off)
        //    Each track.stop() physically releases the webcam/mic hardware.
        //    Without this the green camera light stays on forever.
        //
        // 2. Close every RTCPeerConnection in the peers ref.
        //    This is the fix for the audio feedback continuing after close.
        //    Stopping the local tracks does NOT close the WebRTC pipe itself.
        //    The pipe (RTCPeerConnection) is a separate channel between browsers.
        //    If we don't close it, audio data keeps flowing through the pipe
        //    even after the component is gone — causing the echo you heard.
        //    .close() terminates the pipe and kills all audio/video transmission.
        // ----------------------------------------------------------
        return () => {
            // Step 1: Turn off camera and mic hardware
            setLocalstreams((currentStream) => {
                if (currentStream) {
                    console.log("[🛑 MEDIA] Closing VideoBubble. Turning off the camera hardware.");
                    currentStream.getTracks().forEach((track) => track.stop())
                }
                return null;
            });

            // Step 2: Close all active WebRTC peer connections
            // This kills the audio/video pipe to every connected user.
            // Without this the pipe stays open and audio feedback continues.
            console.log("[🔌 PEERS] Closing all peer connections on unmount...");
            Object.values(peers.current).forEach((pc) => {
                pc.close();
                console.log("[🔌 PEERS] Peer connection closed.");
            });
            peers.current = {}; // clear the ref so old connections don't linger
        }

    }, []); // Empty array = run only once on mount


    /*
     * HELPER FUNCTION: createPeerConnection
     *
     * This function is called every time we need to connect to a new person.
     * It receives:
     *   - targetsocketId: the socket.id of the remote user we are connecting to
     *   - currentLocalStream: our own camera/mic stream that we send through the pipe
     *
     * IMPORTANT — what this function does NOT do:
     *   Calling this function does NOT immediately open a pipe between browsers.
     *   It creates a blank RTCPeerConnection object in memory.
     *   The actual direct browser-to-browser pipe opens later, automatically,
     *   after the full Offer → Answer → ICE candidate exchange is complete.
     *
     * WHY useCallback here?
     *   Every time any state changes in this hook (e.g. a new remote stream arrives),
     *   React re-runs the entire hook. Without useCallback, React would create a
     *   brand new createPeerConnection function at a new memory address on every
     *   re-render. The signaling useEffect below has createPeerConnection in its
     *   dependency array. If its reference changes on every re-render, the useEffect
     *   would destroy and recreate itself on every re-render, which means:
     *     - All 5 socket listeners get removed and re-added
     *     - join-video gets emitted again to the server
     *     - The server tells everyone you are a new user
     *     - Everyone sends you duplicate Offers, breaking all connections
     *   useCallback says: only create a new function if socket changes.
     *   Otherwise, return the exact same function reference from memory.
     *   This keeps the signaling useEffect stable and prevents the above disaster.
     */
    const createPeerConnection = useCallback((targetsocketId: string, currentLocalStream: MediaStream) => {

        // STEP A: Create the blank connection object.
        // The iceServers array tells the browser to use Google's STUN server.
        // The STUN server's only job is to reply with our public IP address
        // so the other browser knows how to reach us through the internet.
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" }
            ]
        })

        // STEP B: Load OUR camera and mic into the connection.
        // A MediaStream contains multiple "tracks" (one video, one audio).
        // addTrack() says: "when the pipe opens, send this track to the other person".
        // Without this, the other person would connect but see a blank screen.
        currentLocalStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, currentLocalStream)
        })

        // STEP C: Listen for INCOMING video from the other person.
        // ontrack is a callback. It does not run immediately.
        // The browser calls it automatically the moment the direct pipe
        // opens and the other person's video bytes start arriving.
        // event.streams[0] is their live MediaStream.
        // We save it into remotestreams so VideoBubble can render it.
        peerConnection.ontrack = (event) => {
            console.log(`[📺 VIDEO] We just received live video from ${targetsocketId}! Saving it to state...`);
            setRemotestreams((prev) => ({
                ...prev,
                [targetsocketId]: event.streams[0]  // add/update this user's video in our dictionary
            }));
        };

        // STEP D: Listen for our own public IP address from Google STUN.
        // onicecandidate is also a callback. It does not run immediately.
        // After the browser contacts Google's STUN server, the browser calls
        // this callback with our public IP address (the "candidate").
        // We then immediately send that IP to the other person via the
        // Express server, so their browser knows how to reach ours directly.
        peerConnection.onicecandidate = (event) => {
            if (event.candidate && socket) {
                // Forward our IP address to the target user through Express
                socket.emit("webrtc-ice-candidate", {
                    candidate: event.candidate,
                    to: targetsocketId
                });
            }
        };

        // STEP E: Save the connection object in our peers Ref.
        // We need to access this connection object later when we receive
        // an Answer (to call setRemoteDescription on it) and when we
        // receive ICE candidates (to call addIceCandidate on it).
        peers.current[targetsocketId] = peerConnection;

        // Return the connection object so the calling code can
        // immediately call createOffer() or setRemoteDescription() on it.
        return peerConnection;
    }, [socket]);



    /*
     * EFFECT 2: The Signaling useEffect — The Core of WebRTC
     *
     * This effect wires all the socket listeners that run the
     * Offer → Answer → ICE handshake between two browsers.
     *
     * It only runs when BOTH of these are true:
     *   - socket is not null (we are connected to Express)
     *   - localstreams is not null (camera permission was granted)
     *
     * Why do we need both before starting?
     *   Because every time we call createPeerConnection(), we immediately
     *   load our camera tracks into it with addTrack(). If localstreams is
     *   null, we have no tracks to add — the other person would connect but
     *   see a completely blank screen from our side.
     *
     * Dependency array: [socket, localstreams, roomId, createPeerConnection]
     *   This effect re-runs only when one of these 4 values actually changes.
     *   In practice this runs once: when the camera is granted and socket is ready.
     *   After that, createPeerConnection is stable (useCallback), so this
     *   effect stays alive for the entire time the VideoBubble is open.
     */
    useEffect(() => {
        if (!socket || !localstreams) return;

        /*
         * LISTENER 1: handleUserConnected
         * A NEW user just opened their video bubble in our room.
         * WE are already here, so WE send them an Offer first.
         * Guard: if we already have a connection to this person, skip.
         * (This prevents duplicate connections when React Strict Mode re-runs the effect.)
         */
        const handleUserConnected = async (newUserId: string) => {
            if (peers.current[newUserId]) {
                console.log("[⚠️ SKIP] Already have a connection to:", newUserId, "— skipping duplicate offer.");
                return;
            }
            console.log("[📞 OFFER] New user joined video:", newUserId, "— We are sending them an Offer...");
            const peerConnection = createPeerConnection(newUserId, localstreams)
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer)

            socket.emit("webrtc-offer", { offer, to: newUserId })
            console.log("[📤 OFFER] Offer sent to:", newUserId);
        }

        /*
         * LISTENER 2: handleReceiveOffer
         * WE just opened video, and someone already in the room sent us their Offer.
         * Guard: if we already have a connection to this person, skip.
         * (This prevents the 'Called in wrong state: stable' error on duplicate runs.)
         */
        const handleReceiveOffer = async ({ offer, from }: { offer: RTCSessionDescriptionInit, from: string }) => {
            if (peers.current[from]) {
                console.log("[⚠️ SKIP] Already have a connection to:", from, "— skipping duplicate offer.");
                return;
            }
            console.log("[📨 OFFER] We received an Offer from:", from, "— Sending Answer back...");
            const peerConnection = createPeerConnection(from, localstreams)
            //we get the offer object and we read it by setRemoteDescription()
            await peerConnection.setRemoteDescription(offer)
            //acc to that we generate answer with createAnswer and set it in localdescriptions()
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer)

            socket.emit("webrtc-answer", { answer, to: from })
            console.log("[📤 ANSWER] Answer sent back to:", from);
        }

        /*
         * LISTENER 3: handleReceiveAnswer
         * Triggered when: the server forwards us an Answer from the user we sent an Offer to.
         * This means: the person we initiated contact with has replied and agreed on video formats.
         * Steps:
         *   1. Find their existing connection object in our peers ref.
         *   2. Save their Answer with setRemoteDescription.
         * After this, both sides have set Local and Remote descriptions.
         * The browser now knows it can proceed to establish the direct pipe.
         */
        const handleReceiveAnswer = async ({ answer, from }: { answer: RTCSessionDescriptionInit, from: string }) => {
            console.log("[✅ ANSWER] Received Answer from:", from, "— Connection fully negotiated!");
            const peerConnection = peers.current[from];
            if (peerConnection) {
                await peerConnection.setRemoteDescription(answer);
            }
        };

        /*
         * LISTENER 4: handleReceiveIceCandidate
         * Triggered when: the server forwards us the other person's public IP address.
         * ICE candidates are the network routing details that allow the two browsers
         * to find each other through the internet and firewalls.
         * Steps:
         *   1. Find their existing connection object in our peers ref.
         *   2. Call addIceCandidate() — this hands the IP info to the browser.
         *      The browser uses it to open the direct video pipe.
         * This fires multiple times (10-20 times) as the browser discovers
         * multiple possible network paths. Each one is added to improve reliability.
         */
        const handleReceiveIceCandidate = async ({ candidate, from }: { candidate: RTCIceCandidateInit, from: string }) => {
            const peerConnection = peers.current[from];
            if (peerConnection) {
                await peerConnection.addIceCandidate(candidate);
            }
        };

        /*
         * LISTENER 5: handleUserDisconnected
         * Triggered when: the server tells us someone closed their tab.
         * We need to:
         *   1. Close and delete their RTCPeerConnection from our peers ref.
         *      (Closing it stops the browser from keeping the pipe alive.)
         *   2. Delete their MediaStream from remotestreams state.
         *      (This causes React to remove their video tile from the UI.)
         */
        const handleUserDisconnected = (leavingUserId: string) => {
            console.log("[❌ DISCONNECT] User left:", leavingUserId, "— Cleaning up their connection...");
            if (peers.current[leavingUserId]) {
                peers.current[leavingUserId].close();
                delete peers.current[leavingUserId];
            }
            setRemotestreams((prev) => {
                const updated = { ...prev };
                delete updated[leavingUserId];
                return updated;
            });
        };

        /* Register all 6 listeners on the socket */

        // When a remote user toggles their camera, update our remoteCameraStates dictionary.
        // This triggers the participants sync in VideoBubble which swaps video <-> avatar.
        const handleRemoteCameraState = ({ userId, isCameraOff }: { userId: string, isCameraOff: boolean }) => {
            console.log(`[📷 REMOTE CAM] User ${userId} turned camera ${isCameraOff ? "OFF" : "ON"}`);
            setRemoteCameraStates(prev => ({ ...prev, [userId]: isCameraOff }));
        };

        socket.on("user-connected-video", handleUserConnected);
        socket.on("webrtc-offer", handleReceiveOffer);
        socket.on("webrtc-answer", handleReceiveAnswer);
        socket.on("webrtc-ice-candidate", handleReceiveIceCandidate);
        socket.on("user-disconnected", handleUserDisconnected);
        socket.on("remote-camera-state", handleRemoteCameraState);

        /*
         * Now that all listeners are ready, tell the server we want to join video.
         * The server will broadcast "user-connected-video" to everyone else in the room.
         * Those users will then call handleUserConnected and send us their Offers.
         * We emit AFTER setting up listeners so we never miss an incoming Offer.
         */
        console.log("[📡 SIGNAL] Emitting join-video to server for room:", roomId);
        socket.emit("join-video", roomId, callerName || "Someone");

        /*
         * CLEANUP: runs when the VideoBubble closes or when the dependency array changes.
         * We must remove all socket listeners to prevent memory leaks and duplicate handlers.
         * socket.off() removes the specific named function we attached earlier.
         * Without this, old listeners pile up every time the effect re-runs.
         */
        return () => {
            console.log("[🧹 CLEANUP] Removing all WebRTC socket listeners.");
            socket.off("user-connected-video", handleUserConnected);
            socket.off("webrtc-offer", handleReceiveOffer);
            socket.off("webrtc-answer", handleReceiveAnswer);
            socket.off("webrtc-ice-candidate", handleReceiveIceCandidate);
            socket.off("user-disconnected", handleUserDisconnected);
            socket.off("remote-camera-state", handleRemoteCameraState);
        };

    }, [socket, localstreams, roomId, createPeerConnection])


    // ----------------------------------------------------------
    // TOGGLE MIC
    // Finds the audio track inside localstreams and flips its
    // .enabled property. When enabled=false, the browser sends
    // silence to the other person instead of real microphone audio.
    // Returns the new enabled state (true = mic is on).
    // ----------------------------------------------------------
    const toggleMic = useCallback(() => {
        if (!localstreams) return;
        const audioTrack = localstreams.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            console.log("[🎤 MIC]", audioTrack.enabled ? "Microphone ON" : "Microphone MUTED");
        }
    }, [localstreams]);

    // ----------------------------------------------------------
    // TOGGLE CAMERA
    // Finds the video track and flips .enabled.
    // When enabled=false, the browser sends black frames.
    // ALSO emits a socket signal to tell all other users in the
    // room that this person's camera is now on or off.
    // They receive "remote-camera-state" and update their UI
    // to show the avatar instead of a frozen/black video tile.
    // ----------------------------------------------------------
    const toggleCamera = useCallback((isCameraOff: boolean) => {
        if (!localstreams) return;
        const videoTrack = localstreams.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !isCameraOff;
            console.log("[📷 CAMERA]", isCameraOff ? "Camera OFF" : "Camera ON");
        }
        // Tell everyone else in the room about the new camera state
        if (socket) {
            socket.emit("camera-state-change", { roomId, isCameraOff });
        }
    }, [localstreams, socket, roomId]);


    // ----------------------------------------------------------
    // RETURN
    // Export the data that VideoBubble.tsx needs:
    //   localstreams  → render in your own <video> tile
    //   remotestreams → map over this to render one <video> per remote user
    // We will add more exports here in the next step (remotestreams, toggleMic, etc.)
    // ----------------------------------------------------------
    return {
        localstreams,
        remotestreams,
        remoteCameraStates,
        toggleMic,
        toggleCamera
    };

}