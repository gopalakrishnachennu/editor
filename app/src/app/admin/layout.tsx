"use client";

import { Sidebar, Header, MobileNav } from "@/components/navigation";
import { AuthGuard } from "@/components/guards";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard requireAdmin>
            <div className="min-h-screen bg-gray-50">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block">
                    <Sidebar />
                </div>

                {/* Mobile Nav */}
                <MobileNav />

                {/* Main Content */}
                <div className="lg:ml-64">
                    <Header />
                    <main className="p-6 pt-6 lg:pt-6 mt-16 lg:mt-0">{children}</main>
                </div>
            </div>
        </AuthGuard>
    );
}
