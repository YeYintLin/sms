import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Chatbot from './Chatbot';
import RightSidebar from './RightSidebar';

const Layout = ({ onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const handleToggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
    };
    return (
        <div className="layout">
            <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
            <div className="main-area">
                <Navbar
                    onLogout={onLogout}
                    onToggleSidebar={handleToggleSidebar}
                    onToggleRightSidebar={() => setIsRightSidebarOpen((prev) => !prev)}
                    isRightSidebarOpen={isRightSidebarOpen}
                />
                <div className="content-wrapper">
                    <div className="page-content">
                        <Outlet />
                    </div>
                    {isRightSidebarOpen && <RightSidebar />}
                </div>
            </div>
            <Chatbot isOpen={isChatOpen} onToggle={() => setIsChatOpen((prev) => !prev)} showLauncher />
        </div>
    );
};

export default Layout;
