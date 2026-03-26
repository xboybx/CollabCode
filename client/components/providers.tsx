"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
}


/* 
Think of the SessionProvider as a set of a walkie-talkies for your entire React app.

What is it?
Behind the scenes, the Provider uses a React Context. It wraps your entire application and says: "If any component anywhere in this app needs to know if the user is logged in, I have the answer right here."

Why does signIn() needs it?
Syncing State: When you call signIn(), it updates a global state. Without the Provider, your navbar wouldn't "know" the login was successful, and it wouldn't know when to show your Profile picture instead of the "Login" button.

Client-Side "Memory": The Provider caches the user's session in the browser memory. This makes it so that when you navigate between pages like /login and /dashboard, the check for your session is instant because it's already in the Provider's pocket.

Automatic Refresh: It also handles "Session Polling." If you leave your tab open for 3 days, the Provider is responsible for automatically checking if your token has expired and silently refreshing it so you don't get kicked out while coding!
*/