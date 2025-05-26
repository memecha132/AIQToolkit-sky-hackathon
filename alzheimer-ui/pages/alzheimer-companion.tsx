import { useState, useEffect } from 'react';
import Head from 'next/head';
import { AlzheimerChatBox } from '../components/Chat/AlzheimerChatBox';
import { BackgroundMusic } from '../components/Audio/BackgroundMusic';
import AlzheimerNav from '../components/Navigation/AlzheimerNav';

export default function AlzheimerCompanion() {
  const [fontSizeMode, setFontSizeMode] = useState('normal');
  const [highContrastMode, setHighContrastMode] = useState(false);

  // 处理紧急呼叫
  const handleEmergencyCall = () => {
    alert("正在拨打紧急联系人电话...");
    // 实际项目中应该集成通讯API
  };

  // 处理位置共享
  const handleLocationShare = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          alert(`位置已成功共享！\n纬度: ${latitude}\n经度: ${longitude}`);
          // 实际项目中应该发送给监护人
        },
        (error) => {
          console.error("无法获取位置信息", error);
          alert("无法获取位置信息，请确保已授权位置权限。");
        }
      );
    } else {
      alert("您的浏览器不支持位置服务。");
    }
  };

  // 切换字体大小
  const toggleFontSize = () => {
    setFontSizeMode(prev => prev === 'normal' ? 'large' : 'normal');
  };

  // 切换高对比度模式
  const toggleHighContrast = () => {
    setHighContrastMode(prev => !prev);
  };

  // 设置页面类名
  const getPageClasses = () => {
    let classes = 'min-h-screen bg-warm-primary';
    
    if (fontSizeMode === 'large') {
      classes += ' large-font';
    }
    
    if (highContrastMode) {
      classes += ' high-contrast';
    }
    
    return classes;
  };

  // 模拟初始消息
  const initialMessages = [
    {
      id: '1',
      role: 'assistant' as const,
      content: '您好！我是您的智能陪伴助手。今天是2025年5月24日，天气晴朗，温度25℃。您今天感觉如何？',
      timestamp: new Date(Date.now() - 60000),
    },
  ];

  return (
    <div className={getPageClasses()}>
      <Head>
        <title>阿尔茨海默症智能陪伴助手</title>
        <meta name="description" content="专为阿尔茨海默症患者设计的智能陪伴助手，提供友好简洁的交互体验" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-5xl pb-24">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-4xl md:text-5xl font-bold text-warm-text">
            智能陪伴助手
          </h1>
          <div className="flex gap-3">
            <button
              onClick={toggleFontSize}
              className="alzheimer-button-secondary py-2 px-4 flex items-center"
              aria-label="切换字体大小"
              title="切换字体大小"
            >
              {fontSizeMode === 'normal' ? 'A' : 'A+'}
            </button>
            <button
              onClick={toggleHighContrast}
              className="alzheimer-button-secondary py-2 px-4"
              aria-label="切换对比度"
              title="切换高对比度模式"
            >
              高对比度 {highContrastMode ? '开' : '关'}
            </button>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-warm-lg overflow-hidden h-[calc(100vh-200px)]">
          <AlzheimerChatBox 
            initialMessages={initialMessages}
            botName="智能陪伴助手"
            onEmergencyCall={handleEmergencyCall}
            onLocationShare={handleLocationShare}
          />
        </div>

        <footer className="mt-8 text-center text-sm text-warm-text">
          <p>© 2025 阿尔茨海默症智能陪伴助手 | 基于 AIQ Toolkit 开发</p>
          <p className="mt-1">
            如需帮助，请联系技术支持: 400-123-4567
          </p>
        </footer>
      </main>

      {/* 底部导航栏 */}
      <AlzheimerNav />
    </div>
  );
}