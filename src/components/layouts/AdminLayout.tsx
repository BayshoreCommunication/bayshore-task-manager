"use client";
import { ReactNode } from "react";
import Link from "next/link";
import Logout from "../Logout";
import { Menu } from "@base-ui/react/menu";
import { Button } from "../ui/button";
import { ClientSessionWatcher } from "../ClientSessionWatcher";

const navLinks = [
  { name: "Dashboard", href: "/admin" },
  { name: "Tasks", href: "/admin/tasks" },
  { name: "Users", href: "/admin/users" },
  { name: "Credentials", href: "/admin/credentials" },
  { name: "Settings", href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-100 text-black">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4 space-y-4 hidden md:flex flex-col justify-between min-h-screen">
        <div>
          <h1 className="text-2xl font-bold text-center mb-6">Admin Panel</h1>
          <nav className="space-y-2 flex flex-col justify-center items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-md font-semibold"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-6 py-3 overflow-y-auto">
        <div className="flex justify-end items-center space-x-2 mb-2">
          <div>
            <Logout className="cursor-pointer" />
          </div>
          <div className="md:hidden">
            <Menu.Root>
              <Menu.Trigger
                render={<Button variant="outline" className="cursor-pointer" />}
              >
                Menu
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner sideOffset={8}>
                  <Menu.Popup>
                    {navLinks.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <Menu.Item>{link.name}</Menu.Item>
                      </Link>
                    ))}
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        </div>
        {children}
      </main>
      <ClientSessionWatcher interval={60000} />
    </div>
  );
}
