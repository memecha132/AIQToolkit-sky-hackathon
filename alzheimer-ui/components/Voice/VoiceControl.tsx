import { useState, useEffect, useCallback, useRef } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface VoiceControlProps {
  onSpeechResult: (text: string) => void;
  onIntermediateResult?: (text: string) => void; // 添加中间结果回调
  textToSpeak?: string;
  autoSpeak?: boolean;
  speakingRate?: number; // 语速控制，0.5-2.0之间，1.0为正常速度
}

export const VoiceControl: React.FC<VoiceControlProps> = ({
  onSpeechResult,
  onIntermediateResult,
  textToSpeak = '',
  autoSpeak = false,
  speakingRate = 0.8, // 默认稍慢的语速，适合老年人
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [textToSpeakSupported, setTextToSpeakSupported] = useState(true);
  const recognition = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const [pauseDuration, setPauseDuration] = useState<number | null>(null);
  const lastSpeechTimestamp = useRef<number>(Date.now());
  const [continuousMode, setContinuousMode] = useState(false);

  // 初始化语音识别
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 检查浏览器是否支持语音识别
      const SpeechRecognition = window.SpeechRecognition || window['webkitSpeechRecognition'];
      const SpeechGrammarList = window.SpeechGrammarList || window['webkitSpeechGrammarList'];
      
      if (SpeechRecognition) {
        recognition.current = new SpeechRecognition();
        recognition.current.continuous = true;
        recognition.current.interimResults = true;
        recognition.current.lang = 'zh-CN'; // 设置为中文识别

        // 检查浏览器是否支持语音合成
        speechSynthesisRef.current = window.speechSynthesis;
        setTextToSpeakSupported(!!speechSynthesisRef.current);
      } else {
        setSpeechSupported(false);
        console.log('您的浏览器不支持语音识别功能');
      }
    }

    return () => {
      if (recognition.current) {
        recognition.current.abort();
      }
      if (speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  // 检测长时间暂停 - 仅用于显示指示器，不再触发语音提示
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isListening) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const timeSinceLastSpeech = now - lastSpeechTimestamp.current;
        
        // 如果暂停超过2.5秒，认为是一次完整的输入
        if (timeSinceLastSpeech > 2500) {
          setPauseDuration(timeSinceLastSpeech);
        } else {
          setPauseDuration(null);
        }
      }, 500);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isListening]);

  // 语音识别处理
  useEffect(() => {
    if (!recognition.current) return;

    const handleResult = (event: any) => {
      let intermediateTranscript = '';
      let finalTranscript = '';

      // 分离中间结果和最终结果
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          intermediateTranscript += result[0].transcript;
        }
      }

      // 调用父组件中间结果回调，更新输入框
      if (intermediateTranscript && onIntermediateResult) {
        onIntermediateResult(intermediateTranscript);
      }

      // 只有最终结果调用 onSpeechResult
      if (finalTranscript) {
        onSpeechResult(finalTranscript);
      }
      
      lastSpeechTimestamp.current = Date.now();
    };

    const handleEnd = () => {
      if (isListening) {
        recognition.current.start();
      } else {
        setIsListening(false);
      }
    };

    recognition.current.onresult = handleResult;
    recognition.current.onend = handleEnd;

    return () => {
      recognition.current.onresult = null;
      recognition.current.onend = null;
    };
  }, [isListening, onSpeechResult, onIntermediateResult]);

  // 处理语音合成
  useEffect(() => {
    if (textToSpeak && autoSpeak && textToSpeakSupported && speechSynthesisRef.current) {
      speakText(textToSpeak);
    }
  }, [textToSpeak, autoSpeak, textToSpeakSupported]);

  // 开始/停止语音识别
  const toggleListening = useCallback(() => {
    if (!recognition.current || !speechSupported) return;

    if (isListening) {
      recognition.current.stop();
      setIsListening(false);
      setContinuousMode(false);
    } else {
      recognition.current.start();
      setIsListening(true);
      lastSpeechTimestamp.current = Date.now();
    }
  }, [isListening, speechSupported]);

  // 启用连续模式（带自动回应）
  const startContinuousMode = useCallback(() => {
    if (!recognition.current || !speechSupported) return;

    // 如果当前没有在监听状态才启动，防止重复调用start()
    if (!isListening) {
      recognition.current.start();
      setIsListening(true);
      setContinuousMode(true);
      lastSpeechTimestamp.current = Date.now();
    } else {
      // 如果已经在监听，只需要启用连续模式
      setContinuousMode(true);
    }
  }, [speechSupported, isListening]);

  // 语音合成
  const speakText = useCallback((text: string) => {
    if (!speechSynthesisRef.current || !textToSpeakSupported) return;
    
    // 取消正在进行的语音
    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = speakingRate;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthesisRef.current.speak(utterance);
  }, [textToSpeakSupported, speakingRate]);

  // 播放当前回复
  const speakReply = useCallback(() => {
    if (textToSpeak) {
      speakText(textToSpeak);
    }
  }, [textToSpeak, speakText]);

  // 停止语音合成
  const stopSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return (
    <div className="flex items-center justify-center gap-4 bg-warm-secondary rounded-full p-3 shadow-warm">
      {/* 语音输入控制 */}
      <button
        onClick={toggleListening}
        className={`p-3 rounded-full transition-all duration-200 ${
          isListening
            ? 'bg-warm-error text-white pulse-animation'
            : 'bg-white text-warm-button hover:bg-warm-accent'
        }`}
        disabled={!speechSupported}
        aria-label={isListening ? '停止语音输入' : '开始语音输入'}
        title={isListening ? '停止语音输入' : '开始语音输入'}
      >
        {isListening ? (
          <FaMicrophoneSlash size={24} />
        ) : (
          <FaMicrophone size={24} />
        )}
      </button>

      {/* 连续对话模式按钮 */}
      <button
        onClick={startContinuousMode}
        className={`p-3 rounded-full transition-all duration-200 ${
          continuousMode
            ? 'bg-warm-success text-white pulse-animation'
            : 'bg-white text-warm-button hover:bg-warm-accent'
        }`}
        disabled={!speechSupported}
        aria-label="连续对话模式"
        title="连续对话模式（会在您停顿时提示）"
      >
        <span className="text-lg font-bold">连续对话</span>
      </button>

      {/* 语音输出控制 */}
      <button
        onClick={isSpeaking ? stopSpeaking : speakReply}
        className={`p-3 rounded-full transition-all duration-200 ${
          isSpeaking
            ? 'bg-warm-error text-white pulse-animation'
            : 'bg-white text-warm-button hover:bg-warm-accent'
        }`}
        disabled={!textToSpeakSupported || !textToSpeak}
        aria-label={isSpeaking ? '停止朗读' : '朗读回复'}
        title={isSpeaking ? '停止朗读' : '朗读回复'}
      >
        {isSpeaking ? (
          <FaVolumeMute size={24} />
        ) : (
          <FaVolumeUp size={24} />
        )}
      </button>
      
      {/* 暂停指示器 - 当用户停顿较长时间时显示 */}
      {pauseDuration && pauseDuration > 2500 && isListening && (
        <div className="text-sm text-warm-text bg-warm-accent px-2 py-1 rounded-md animate-pulse">
          检测到停顿...
        </div>
      )}
    </div>
  );
};