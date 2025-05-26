import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { FaHeart, FaPhone, FaLocationArrow, FaBell, FaCamera } from 'react-icons/fa';
import { VoiceControl } from '../Voice/VoiceControl';
import { TextToSpeech } from '../Audio/TextToSpeech';
import { MemoryPanel } from '../Memory/MemoryPanel';
import { ReminderPanel } from '../Reminder/ReminderPanel';
import { v4 as uuidv4 } from 'uuid';

// 新增：折叠面板组件
import React from 'react';

// 折叠面板，默认折叠，可展开
const CollapsiblePanel: React.FC<{title: string, children: React.ReactNode, defaultOpen?: boolean}> = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="my-2 border rounded bg-gray-50 dark:bg-gray-800">
      <div
        className="flex items-center cursor-pointer px-3 py-2 select-none text-base font-semibold text-gray-700 dark:text-gray-200"
        onClick={() => setOpen(o => !o)}
      >
        <span className="mr-2">{open ? '▼' : '▶'}</span>
        {title}
      </div>
      {open && <div className="px-4 pb-3 text-sm text-gray-800 dark:text-gray-100">{children}</div>}
    </div>
  );
};

// 辅助函数：只提取 Final Answer
function extractFinalAnswer(content: string): string {
  // 优先从 Final Answer: ... 提取
  const match = content.match(/Final Answer[:：]\s*([\s\S]*?)(?=(\n|$))/);
  if (match && match[1]) {
    return match[1].trim();
  }
  // 如果没有 Final Answer，回退为原内容，同样需要过滤
  const fullContent = content.trim();
  const inputQuestionIndex = fullContent.indexOf("原始输入问题");
  if (inputQuestionIndex !== -1) {
    return fullContent.substring(0, inputQuestionIndex).trim();
  }
  return fullContent;
}

// 辅助函数：解析助手消息，识别结构化内容
// 优化：中间过程放在上方，主回复单独展示在下方
function renderAssistantContent(content: string) {
  // 从内容中提取中间步骤和最终答案
  const intermediatestepRegex = /<intermediatestep>([\s\S]*?)<\/intermediatestep>/g;
  const intermediateMatches = [...content.matchAll(intermediatestepRegex)];
  
  // 从内容中移除所有中间步骤标记，只保留最终答案部分
  let finalAnswer = content.replace(intermediatestepRegex, '').trim();
  
  // 使用extractFinalAnswer函数来获取处理后的最终答案
  finalAnswer = extractFinalAnswer(finalAnswer);
  
  if (intermediateMatches.length > 0) {
    // 有中间步骤，创建折叠面板
    const steps = intermediateMatches.map((match, idx) => {
      try {
        const stepContent = match[1];
        const stepData = JSON.parse(stepContent);
        
        // 提取步骤名称或类型作为标题
        let title = `步骤 ${idx + 1}`;
        if (stepData.content?.name) title = stepData.content.name;
        if (stepData.type && stepData.type === 'system_intermediate') title = stepData.type;
        if (stepData.status && stepData.content?.name) {
          const status = stepData.status === 'complete' ? '完成' : '开始';
          title = `${stepData.content.name} - ${status}`;
        }
        
        return (
          <CollapsiblePanel key={idx} title={title} defaultOpen={false}>
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto font-mono">{stepContent}</pre>
          </CollapsiblePanel>
        );
      } catch(e) {
        // 如果JSON解析失败，仍然显示原始内容
        return (
          <CollapsiblePanel key={idx} title={`步骤 ${idx + 1}`} defaultOpen={false}>
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto font-mono">{match[1]}</pre>
          </CollapsiblePanel>
        );
      }
    });
    
    return (
      <div className="flex flex-col space-y-4">
        {/* 中间过程面板 */}
        <div className="w-full">
          <CollapsiblePanel title="查看中间调用过程" defaultOpen={false}>
            <div className="space-y-2">
              {steps}
            </div>
          </CollapsiblePanel>
        </div>
        
        {/* 最终答案 - 使用更大、更突出的样式 */}
        {finalAnswer && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-lg text-black dark:text-white">{finalAnswer}</div>
          </div>
        )}
      </div>
    );
  }
  
  // 没有中间步骤时，直接返回内容
  return <div className="whitespace-pre-wrap text-black dark:text-white">{finalAnswer}</div>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Reminder {
  id: string;
  title: string;
  time: string;
  type: 'medicine' | 'meal' | 'sleep' | 'other';
  description?: string;
  isCompleted: boolean;
}

interface AlzheimerChatBoxProps {
  initialMessages?: Message[];
  botName?: string;
  onSendMessage?: (message: string) => Promise<string>;
  onEmergencyCall?: () => void;
  onLocationShare?: () => void;
}

export const AlzheimerChatBox: React.FC<AlzheimerChatBoxProps> = ({
  initialMessages = [],
  botName = '智能陪伴助手',
  onSendMessage,
  onEmergencyCall,
  onLocationShare,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAssistantMessage, setLastAssistantMessage] = useState('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [autoReadResponse, setAutoReadResponse] = useState<boolean>(true); // 自动朗读回复默认开启
  const [errorCount, setErrorCount] = useState(0); // 跟踪连续错误次数
  const [reminders, setReminders] = useState<Reminder[]>([]); // 提醒事项状态
  const [remindersInitialized, setRemindersInitialized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // 控制侧边栏折叠状态

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const controllerRef = useRef<AbortController | null>(null); // 用于取消请求
  const [shouldAutoScroll, setShouldAutoScroll] = useState<boolean>(true); // 控制是否自动滚动
  const chatContainerRef = useRef<HTMLDivElement>(null); // 引用消息容器

  // 判断是否是移动设备
  const isMobile = () => {
    const userAgent =
      typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    return mobileRegex.test(userAgent);
  };

  // 移动设备状态检测
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  useEffect(() => {
    setIsMobileDevice(isMobile());
    
    // 处理窗口大小变化
    const handleResize = () => {
      setIsMobileDevice(window.innerWidth < 1024); // 在小于1024px时视为移动设备
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 滚动到最新消息
  const scrollToBottom = () => {
    if (shouldAutoScroll) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100); // 添加短暂延迟确保DOM已更新
    }
  };

  // 当消息更新时，只有在需要时才滚动到底部
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);
  
  // 监听滚动事件决定是否自动滚动
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    };

    chatContainer.addEventListener('scroll', handleScroll);
    return () => {
      chatContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // 动态调整文本区域高度
  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
      textareaRef.current.style.overflow = `${textareaRef?.current?.scrollHeight > 400 ? 'auto' : 'hidden'}`;
    }
  }, [inputValue]);

  // 处理键盘按键
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  // 处理消息发送
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // 创建用户消息
    const userMessage: Message = {
      id: uuidv4(), // 使用唯一ID
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    
    // 创建 AbortController 用于取消请求
    controllerRef.current = new AbortController();
    
    try {
      if (onSendMessage) {
        // 如果提供了自定义的 onSendMessage 处理函数，使用它
        const response = await onSendMessage(content);
        
        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setLastAssistantMessage(response);
        setErrorCount(0); // 重置错误计数
      } else {
        // 使用与 Chat.tsx 相同的方式通过 api/chat.ts 获取响应
        const chatCompletionURL =
          sessionStorage.getItem('chatCompletionURL') ||
          process.env.NEXT_PUBLIC_HTTP_CHAT_COMPLETION_URL ||
          'http://127.0.0.1:8000/chat';
        
        const enableIntermediateSteps =
          sessionStorage.getItem('enableIntermediateSteps') === 'true' || true;
        
        // 构建与 Chat.tsx 一致的请求负载
        const payload = {
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          chatCompletionURL,
          additionalProps: { enableIntermediateSteps },
        };
        
        // 调用 api/chat.ts 处理请求
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controllerRef.current.signal,
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        
        // 获取响应文本
        const responseText = await res.text();
        
        // 从响应中提取干净的文本内容，移除所有中间步骤标签
        const cleanResponse = responseText.replace(/<intermediatestep>[\s\S]*?<\/intermediatestep>/g, '');
        
        if (cleanResponse && cleanResponse.trim()) {
          // 添加助手消息
          const assistantMessage: Message = {
            id: uuidv4(),
            role: 'assistant',
            content: cleanResponse.trim().replace("原始输入问题的最终答案",""), // 使用清理后的响应
            timestamp: new Date(),
          };
          console.log('assistant message', cleanResponse.trim().replace("原始输入问题的最终答案",""))
          setMessages(prev => [...prev, assistantMessage]);
          setLastAssistantMessage(cleanResponse.trim().replace("原始输入问题的最终答案",""));
          setErrorCount(0); // 重置错误计数
        } else {
          // 如果清理后的响应为空，检查是否有实际内容或错误
          if (responseText && responseText.trim()) {
            // 检查是否全是中间步骤，尝试从最后一个中间步骤提取最终答案
            const intermediateSteps = responseText.match(/<intermediatestep>(.*?)<\/intermediatestep>/gs);
            if (intermediateSteps && intermediateSteps.length > 0) {
              try {
                // 尝试从最后一个中间步骤中提取最终答案
                const lastStep = intermediateSteps[intermediateSteps.length - 1];
                const stepContent = lastStep.replace('<intermediatestep>', '').replace('</intermediatestep>', '');
                const stepData = JSON.parse(stepContent);
                
                // 查找包含 Final Answer 的内容
                let finalAnswer = '';
                if (stepData.content?.payload && typeof stepData.content.payload === 'string') {
                  const match = stepData.content.payload.match(/Final Answer:\s*(.*?)(?:$|")/);
                  if (match && match[1]) {
                    finalAnswer = match[1].trim();
                  }
                }
                
                if (finalAnswer) {
                  // 使用提取的最终答案
                  const assistantMessage: Message = {
                    id: uuidv4(),
                    role: 'assistant',
                    content: finalAnswer,
                    timestamp: new Date(),
                  };
                  
                  setMessages(prev => [...prev, assistantMessage]);
                  setLastAssistantMessage(finalAnswer);
                  setErrorCount(0);
                  return; // 成功提取最终答案，退出函数
                }
              } catch (error) {
                console.error('解析中间步骤时出错:', error);
                // 继续执行，尝试使用原始响应
              }
            }
            
            // 如果无法提取最终答案，使用带警告的原始响应
            const assistantMessage: Message = {
              id: uuidv4(),
              role: 'assistant',
              content: responseText,
              timestamp: new Date(),
            };
            
            setMessages(prev => [...prev, assistantMessage]);
            setLastAssistantMessage(responseText);
            console.warn('响应包含可能的格式问题，但仍然显示');
          } else {
            throw new Error('收到了空响应');
          }
        }
      }
    } catch (error: any) {
      // 处理错误情况
      const errorMessage = error?.message || String(error);
      console.error('聊天请求错误:', errorMessage);
      
      // 如果是用户主动取消请求，不显示错误消息
      if (errorMessage.includes('aborted') || errorMessage.includes('AbortError')) {
        console.log('请求已取消');
        return;
      }
      
      // 更新错误计数
      setErrorCount(prev => prev + 1);
      
      // 构造错误响应
      let errorResponse = '';
      if (errorCount >= 2) {
        // 连续多次错误，提供更详细的提示
        errorResponse = `很抱歉，我遇到了一些技术问题。您可以尝试：\n1. 检查网络连接\n2. 稍后再试\n\n错误详情: ${errorMessage}`;
      } else {
        // 常规错误提示
        errorResponse = `对不起，我在处理您的请求时遇到了问题。错误信息: ${errorMessage}`;
      }
      
      const errorResponseMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: errorResponse,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorResponseMessage]);
      setLastAssistantMessage(errorResponse);
    } finally {
      setIsProcessing(false);
      controllerRef.current = null;
    }
  };

  // 处理语音输入结果
  const handleSpeechResult = (text: string) => {
    setInputValue(text);
    if (text.trim()) {
      handleSendMessage(text);
    }
  };
  
  // 取消当前请求
  const cancelCurrentRequest = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      setIsProcessing(false);
    }
  };

  // 添加提醒
  const addReminder = (reminder: Reminder) => {
    setReminders(prev => [...prev, reminder]);
  };

  // 删除提醒
  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
  };

  // 标记提醒为完成
  const completeReminder = (id: string) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === id ? { ...reminder, isCompleted: !reminder.isCompleted } : reminder
      )
    );
  };

  // 处理提醒初始化
  const handleRemindersInitialized = () => {
    setRemindersInitialized(true);
  };

  // 切换侧边栏折叠状态
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen relative bg-warm-bg">
      {/* 头部区域 - 移动设备上显示 */}
      <div className="lg:hidden bg-warm-accent p-4 rounded-t-xl flex justify-between items-center sticky top-0 z-10">
        <h2 className="text-3xl font-bold text-white">{botName}</h2>
        <div className="flex space-x-2">
          <button 
            onClick={onEmergencyCall}
            className="alzheimer-emergency-button flex items-center"
            aria-label="紧急联系"
            title="紧急联系家人"
          >
            <FaPhone className="mr-2" /> 紧急呼叫
          </button>
          <button 
            onClick={onLocationShare}
            className="alzheimer-button flex items-center"
            aria-label="发送位置"
            title="向家人发送您的位置"
          >
            <FaLocationArrow className="mr-2" /> 发送位置
          </button>
        </div>
      </div>
      
      {/* 主体区域 - 聊天区域和侧边栏的容器 */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* 侧边栏 - 提醒和记忆面板（现在放在左侧） */}
        <div className={`
          lg:w-1/5 h-full flex-shrink-0 bg-warm-secondary p-4 overflow-y-auto
          transition-all duration-300 ease-in-out
          ${isMobileDevice ? 
            (sidebarCollapsed ? 'hidden' : 'fixed inset-0 z-50') : 
            (sidebarCollapsed ? 'w-16' : '')
          }
        `}>
          {/* 侧边栏内容 */}
          <div className={`${sidebarCollapsed && !isMobileDevice ? 'hidden' : 'block'}`}>
            {/* 移动设备上显示的关闭按钮 */}
            {isMobileDevice && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={toggleSidebar}
                  className="alzheimer-button p-2"
                >
                  关闭
                </button>
              </div>
            )}
            
            {/* 侧边栏标题 */}
            <div className="border-b border-warm-border pb-3 mb-6">
              <h2 className="text-2xl font-bold text-warm-text">辅助功能</h2>
            </div>
            
            {/* 提醒面板 */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center text-warm-text">
                <FaBell className="mr-2 text-warm-accent" /> 今日提醒
              </h3>
              <ReminderPanel 
                onReminderAdd={addReminder}
                onReminderComplete={completeReminder}
                onReminderDelete={deleteReminder}
                onInitialized={handleRemindersInitialized}
              />
            </div>
            
            {/* 记忆面板 */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center text-warm-text">
                <FaCamera className="mr-2 text-warm-accent" /> 记忆回溯
              </h3>
              <MemoryPanel />
            </div>
          </div>
          
          {/* 折叠/展开按钮 - 仅在桌面版显示（调整位置到左侧） */}
          {!isMobileDevice && (
            <button
              onClick={toggleSidebar}
              className="absolute top-4 right-4 p-2 rounded-full bg-warm-accent text-white hover:bg-warm-accent-hover"
              aria-label={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
              title={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
            >
              {sidebarCollapsed ? "<" : ">"}
            </button>
          )}
        </div>

        {/* 聊天主区域 */}
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          {/* 桌面设备头部 */}
          <div className="hidden lg:flex bg-warm-accent p-4 rounded-t-xl justify-between items-center z-10">
            <h2 className="text-3xl font-bold text-white">{botName}</h2>
            <div className="flex space-x-2">
              <button 
                onClick={onEmergencyCall}
                className="alzheimer-emergency-button flex items-center"
                aria-label="紧急联系"
                title="紧急联系家人"
              >
                <FaPhone className="mr-2" /> 紧急呼叫
              </button>
              <button 
                onClick={onLocationShare}
                className="alzheimer-button flex items-center"
                aria-label="发送位置"
                title="向家人发送您的位置"
              >
                <FaLocationArrow className="mr-2" /> 发送位置
              </button>
            </div>
          </div>
          
          {/* 消息显示区域 */}
          <div 
            className="flex-1 overflow-y-auto p-4 bg-warm-chat-bg" 
            ref={chatContainerRef} 
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FaHeart className="text-warm-accent text-6xl mb-4" />
                <h3 className="text-2xl font-semibold mb-2">欢迎使用智能陪伴助手</h3>
                <p className="text-xl text-warm-text">
                  我可以陪您聊天，提醒您吃药，帮您联系家人，或者回忆美好时光。
                </p>
                <p className="text-lg text-warm-text mt-4">
                  请试着跟我问好，开始我们的对话吧！
                </p>
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`my-4 ${
                    message.role === 'user'
                      ? 'alzheimer-chat-user'
                      : 'alzheimer-chat-bot'
                  }`}
                >
                  <div className="text-xl leading-relaxed whitespace-pre-wrap">
                    {message.role === 'assistant'
                      ? renderAssistantContent(message.content)
                      : message.content}
                  </div>
                  <div className="text-right text-xs text-warm-text mt-1">
                    {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* 输入区域 */}
          <div className="bg-warm-accent bg-opacity-20 p-4 rounded-b-xl">
            <div className="flex flex-col space-y-4">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onCompositionStart={() => setIsTyping(true)}
                onCompositionEnd={() => setIsTyping(false)}
                onKeyDown={handleKeyDown}
                placeholder="在这里输入消息，或使用下方的语音按钮开始说话...（按下回车键发送）"
                className="w-full p-4 text-2xl rounded-xl border-2 border-warm-accent focus:outline-none focus:ring-2 focus:ring-warm-accent"
                style={{
                  resize: 'none',
                  minHeight: '44px',
                  maxHeight: '120px',
                  overflow: 'auto'
                }}
              />

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setAutoReadResponse(!autoReadResponse)}
                    className={`alzheimer-button flex items-center ${autoReadResponse ? 'bg-warm-accent text-white' : ''}`}
                    aria-label={autoReadResponse ? '关闭自动朗读' : '开启自动朗读'}
                    title={autoReadResponse ? '关闭自动朗读' : '开启自动朗读'}
                  >
                    {autoReadResponse ? '关闭自动朗读' : '开启自动朗读'}
                  </button>
                  
                  {isProcessing && (
                    <button
                      onClick={cancelCurrentRequest}
                      className="alzheimer-button flex items-center bg-warm-accent text-white"
                      aria-label="取消请求"
                      title="取消当前请求"
                    >
                      取消请求
                    </button>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {!isProcessing && lastAssistantMessage && (
                    <TextToSpeech 
                      text={lastAssistantMessage}
                      autoPlay={autoReadResponse}
                    />
                  )}
                  
                  <VoiceControl
                    onSpeechResult={handleSpeechResult}
                    isProcessing={isProcessing}
                  />
                  
                  <button
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={!inputValue.trim() || isProcessing}
                    className="alzheimer-button flex items-center bg-warm-accent text-white disabled:bg-gray-300"
                    aria-label="发送消息"
                    title="发送消息"
                  >
                    发送
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 移动设备底部的侧边栏切换按钮 */}
      {isMobileDevice && (
        <div className="fixed bottom-4 left-4 z-40">
          <button
            onClick={toggleSidebar}
            className="p-4 rounded-full bg-warm-accent text-white shadow-lg"
            aria-label="打开辅助功能"
          >
            <FaBell size={24} />
          </button>
        </div>
      )}
    </div>
  );
};