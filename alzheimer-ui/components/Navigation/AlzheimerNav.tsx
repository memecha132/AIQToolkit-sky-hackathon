import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaHome, FaRobot, FaQuestion, FaPhone } from 'react-icons/fa';

const AlzheimerNav: React.FC = () => {
  const router = useRouter();

  // 判断当前路由是否为活动路由
  const isActiveRoute = (route: string) => {
    return router.pathname === route;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-warm-primary p-3 shadow-warm-lg flex justify-center z-50">
      <div className="flex items-center justify-around w-full max-w-2xl">
        <Link href="/" className={`flex flex-col items-center p-3 rounded-xl ${
          isActiveRoute('/') ? 'bg-warm-accent text-white' : 'text-warm-text hover:bg-warm-secondary'
        }`}>
          <FaHome className="text-3xl mb-1" />
          <span className="text-xl font-medium">首页</span>
        </Link>
        
        <Link href="/alzheimer-companion" className={`flex flex-col items-center p-3 rounded-xl ${
          isActiveRoute('/alzheimer-companion') ? 'bg-warm-accent text-white' : 'text-warm-text hover:bg-warm-secondary'
        }`}>
          <FaRobot className="text-3xl mb-1" />
          <span className="text-xl font-medium">陪伴助手</span>
        </Link>
        
        <Link href="/help" className={`flex flex-col items-center p-3 rounded-xl ${
          isActiveRoute('/help') ? 'bg-warm-accent text-white' : 'text-warm-text hover:bg-warm-secondary'
        }`}>
          <FaQuestion className="text-3xl mb-1" />
          <span className="text-xl font-medium">帮助</span>
        </Link>
        
        <Link href="/contacts" className={`flex flex-col items-center p-3 rounded-xl ${
          isActiveRoute('/contacts') ? 'bg-warm-accent text-white' : 'text-warm-text hover:bg-warm-secondary'
        }`}>
          <FaPhone className="text-3xl mb-1" />
          <span className="text-xl font-medium">联系人</span>
        </Link>
      </div>
    </nav>
  );
};

export default AlzheimerNav;