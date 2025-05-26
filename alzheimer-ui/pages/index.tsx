'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { AlzheimerChatBox } from '../components/Chat/AlzheimerChatBox';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function Home() {
  const [messages, setMessages] = useState([]);
  
  const handleEmergencyCall = () => {
    alert('正在联系您的家人...');
    // 实际项目中应调用紧急联系API
  };

  const handleLocationShare = () => {
    alert('已发送您的位置给家人');
    // 实际项目中应调用位置共享API
  };

  return (
    <>
      <Head>
        <title>阿尔茨海默症智能陪伴助手</title>
        <meta name="description" content="专为阿尔茨海默症患者设计的智能陪伴聊天机器人" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex flex-col h-screen bg-warm-bg">
        <div className="flex-grow">
          <AlzheimerChatBox
            botName="智能陪伴助手"
            onEmergencyCall={handleEmergencyCall}
            onLocationShare={handleLocationShare}
          />
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'zh-CN', ['common'])),
    },
  };
};