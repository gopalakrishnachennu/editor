import { ReactNode } from "react";

export default function VideoEditorLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans antialiased selection:bg-indigo-500/30">
            {children}
        </div>
    );
}
