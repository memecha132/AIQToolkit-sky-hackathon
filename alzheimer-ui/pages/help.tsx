import { useState } from 'react';
import Head from 'next/head';
import { FaVolumeUp, FaMicrophone, FaBell, FaCamera, FaPhone, FaLocationArrow, FaMusic } from 'react-icons/fa';
import AlzheimerNav from '../components/Navigation/AlzheimerNav';

export default function Help() {
  const [fontSizeMode, setFontSizeMode] = useState('normal');
  
  // 切换字体大小
  const toggleFontSize = () => {
    setFontSizeMode(prev => prev === 'normal' ? 'large' : 'normal');
  };
  
  // 帮助主题数据
  const helpTopics = [
    {
      title: '语音交流',
      icon: <FaMicrophone size={28} className="text-warm-accent" />,
      description: '点击语音按钮开始说话，松开按钮结束。助手会理解您的语音并回答您的问题。',
      steps: [
        '点击底部的麦克风按钮',
        '开始说话，语音将自动转为文字',
        '松开按钮或停止说话，系统会自动回应'
      ]
    },
    {
      title: '查看记忆照片',
      icon: <FaCamera size={28} className="text-warm-accent" />,
      description: '浏览家人和朋友的照片，帮助回忆美好时光和重要人物。',
      steps: [
        '在对话中点击"记忆回溯"面板',
        '点击"展开"按钮查看照片集',
        '点击任意照片查看详情和相关人物'
      ]
    },
    {
      title: '服药提醒',
      icon: <FaBell size={28} className="text-warm-accent" />,
      description: '查看您今天需要服用的药物及时间，确保按时服药。',
      steps: [
        '查看"今日提醒"区域',
        '点击"展开"按钮查看详细提醒列表',
        '完成提醒后点击"完成"按钮标记已完成'
      ]
    },
    {
      title: '紧急联系',
      icon: <FaPhone size={28} className="text-warm-accent" />,
      description: '一键联系您的家人或医护人员，在需要帮助时使用。',
      steps: [
        '点击界面顶部的"紧急呼叫"红色按钮',
        '系统会立即拨打您预设的紧急联系人',
        '保持通话直到对方接听'
      ]
    },
    {
      title: '位置共享',
      icon: <FaLocationArrow size={28} className="text-warm-accent" />,
      description: '向家人发送您当前的位置信息，让他们知道您在哪里。',
      steps: [
        '点击界面顶部的"发送位置"按钮',
        '确认位置权限请求',
        '系统会自动向您的家人发送位置'
      ]
    },
    {
      title: '背景音乐',
      icon: <FaMusic size={28} className="text-warm-accent" />,
      description: '播放舒缓的背景音乐，创造轻松的交流环境。',
      steps: [
        '点击屏幕左下角的音乐按钮',
        '调整音量大小',
        '点击静音按钮可暂停音乐'
      ]
    },
  ];

  return (
    <div className={`min-h-screen bg-warm-primary pb-24 ${fontSizeMode === 'large' ? 'large-font' : ''}`}>
      <Head>
        <title>使用帮助 - 阿尔茨海默症智能陪伴助手</title>
        <meta name="description" content="阿尔茨海默症智能陪伴助手使用指南" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-4xl font-bold text-warm-text">使用帮助</h1>
          <button
            onClick={toggleFontSize}
            className="alzheimer-button-secondary py-2 px-4"
            aria-label="切换字体大小"
          >
            {fontSizeMode === 'normal' ? '放大字体' : '恢复字体'}
          </button>
        </header>

        <div className="bg-white rounded-2xl shadow-warm-lg p-6">
          <p className="text-2xl text-center mb-8">
            欢迎使用阿尔茨海默症智能陪伴助手，以下是简单的使用指南
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {helpTopics.map((topic, index) => (
              <div key={index} className="bg-warm-secondary rounded-xl p-5 shadow-warm">
                <div className="flex items-center mb-3">
                  {topic.icon}
                  <h2 className="text-2xl font-semibold ml-3">{topic.title}</h2>
                </div>
                <p className="text-xl mb-4">{topic.description}</p>
                <div className="bg-white rounded-lg p-4">
                  <h3 className="text-xl font-medium mb-2">操作步骤：</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    {topic.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="text-lg">{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-5 bg-warm-accent bg-opacity-20 rounded-xl border-2 border-warm-accent">
            <h2 className="text-2xl font-semibold mb-3">需要更多帮助？</h2>
            <p className="text-xl">
              如果您在使用过程中遇到任何问题，请联系您的家人或拨打技术支持热线：
              <br />
              <strong className="text-warm-button text-2xl">400-123-4567</strong>
            </p>
          </div>
        </div>
      </main>

      <AlzheimerNav />
    </div>
  );
}