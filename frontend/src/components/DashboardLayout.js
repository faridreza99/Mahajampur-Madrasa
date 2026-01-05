import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const DashboardLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        setIsOpen={setIsMobileSidebarOpen}
      />
      <div className="flex flex-col flex-1 min-w-0 w-full md:pl-64">
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
          <div className="pb-6 max-w-full overflow-x-hidden">
            <Outlet />
          </div>
          <footer className="py-3 text-center border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 mt-auto">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Developed By{" "}
              <a
                href="https://maxtechbd.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 font-bold hover:underline"
              >
                Maxtechbd.com
              </a>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
