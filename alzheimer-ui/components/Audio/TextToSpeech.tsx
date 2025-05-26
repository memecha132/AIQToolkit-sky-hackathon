import { useEffect, useRef, useState } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface TextToSpeechProps {
  text: string;
  autoPlay?: boolean;
  rate?: number; // 语速控制，0.5-2.0之间，1.0为正常速度
}

export const TextToSpeech: React.FC<TextToSpeechProps> = ({
  text,
  autoPlay = true,
  rate = 0.9, // 适合老年人的默认语速，稍微慢一点
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 初始化语音合成
  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynthesisRef.current = window.speechSynthesis;
    }

    return () => {
      // 组件卸载时停止语音
      if (speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  // 当文本变化或自动播放设置变化时处理文本朗读
  useEffect(() => {
    if (text && autoPlay && speechSynthesisRef.current) {
      speakText(text);
    }
  }, [text, autoPlay]);

  // 语音合成函数
  const speakText = (textToSpeak: string) => {
    if (!speechSynthesisRef.current) return;
    
    // 如果正在朗读，先取消之前的朗读
    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }
    
    // 创建新的语音合成请求
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'zh-CN'; // 设置中文
    utterance.rate = rate;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    utteranceRef.current = utterance;
    speechSynthesisRef.current.speak(utterance);
  };

  // 切换播放/暂停
  const toggleSpeech = () => {
    if (!speechSynthesisRef.current) return;

    if (isSpeaking) {
      // 停止朗读
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    } else {
      // 开始朗读
      if (text) {
        speakText(text);
      }
    }
  };

  return (
    <button
      onClick={toggleSpeech}
      className={`p-2 rounded-full transition-all duration-200 ${
        isSpeaking
          ? 'bg-warm-accent text-white'
          : 'bg-white text-warm-button hover:bg-warm-accent'
      }`}
      aria-label={isSpeaking ? '停止朗读' : '朗读文本'}
      title={isSpeaking ? '停止朗读' : '朗读文本'}
      disabled={!text}
    >
      {isSpeaking ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
    </button>
  );
};