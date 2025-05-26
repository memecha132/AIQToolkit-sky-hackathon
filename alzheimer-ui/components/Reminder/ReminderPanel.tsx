import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaPills, FaUtensils, FaBed, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

type ReminderType = 'medicine' | 'meal' | 'sleep' | 'other';

interface Reminder {
  id: string;
  title: string;
  time: string;
  type: ReminderType;
  description?: string;
  isCompleted: boolean;
}

interface ReminderPanelProps {
  initialReminders?: Reminder[];
  onReminderAdd?: (reminder: Reminder) => void;
  onReminderComplete?: (id: string) => void;
  onReminderDelete?: (id: string) => void;
  onInitialized?: () => void;
  sidebarView?: boolean; // 新增：是否为侧边栏视图
}

// API调用函数
const callBackendAPI = async (action: string, params: any = {}) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `请执行${action}操作`,
        action: action,
        params: params
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API调用失败:', error);
    throw error;
  }
};

export const ReminderPanel: React.FC<ReminderPanelProps> = ({
  initialReminders = [],
  onReminderAdd,
  onReminderComplete,
  onReminderDelete,
  onInitialized,
  sidebarView = true, // 默认为侧边栏视图
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isExpanded, setIsExpanded] = useState(sidebarView); // 在侧边栏中默认展开
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newReminder, setNewReminder] = useState<Omit<Reminder, 'id' | 'isCompleted'>>({
    title: '',
    time: '',
    type: 'medicine',
    description: '',
  });
  const hasInitialized = useRef(false);

  // 模拟提醒数据
  const defaultReminders: Reminder[] = [
    {
      id: '1',
      title: '服用降压药',
      time: '08:00',
      type: 'medicine',
      description: '早餐后服用一片',
      isCompleted: false,
    },
    {
      id: '2',
      title: '午餐',
      time: '12:00',
      type: 'meal',
      description: '记得多吃蔬菜',
      isCompleted: false,
    },
    {
      id: '3',
      title: '服用降糖药',
      time: '19:00',
      type: 'medicine',
      description: '晚餐后服用一片',
      isCompleted: false,
    },
    {
      id: '4',
      title: '睡觉',
      time: '22:00',
      type: 'sleep',
      description: '记得关灯',
      isCompleted: false,
    },
  ];

  // 从后端获取提醒列表
  const fetchReminders = async () => {
    try {
      setIsLoading(true);
      const response = await callBackendAPI('reminder_list');
      
      if (response.success && response.allReminders) {
        setReminders(response.allReminders);
      } else {
        // 如果后端调用失败，使用默认数据
        setReminders(defaultReminders);
      }
    } catch (error) {
      console.error('获取提醒列表失败:', error);
      // 使用默认数据作为后备
      setReminders(defaultReminders);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化提醒 - 修复无限循环问题，总是从API获取最新数据
  useEffect(() => {
    if (hasInitialized.current) return;
    
    // 总是从API获取最新数据
    fetchReminders();
    hasInitialized.current = true;
    
    if (onInitialized) {
      onInitialized();
    }
  }, []); // 移除initialReminders依赖

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewReminder({
      ...newReminder,
      [name]: value,
    });
  };

  const handleAddReminder = async () => {
    if (!newReminder.title || !newReminder.time) return;

    try {
      setIsLoading(true);
      
      // 调用后端API创建提醒
      const response = await callBackendAPI('reminder_create', {
        title: newReminder.title,
        time: newReminder.time,
        reminder_type: newReminder.type,
        description: newReminder.description
      });

      if (response.success && response.allReminders) {
        // 更新本地状态
        setReminders(response.allReminders);
        
        // 通知父组件更新状态（传递新创建的提醒）
        if (onReminderAdd && response.reminder) {
          onReminderAdd(response.reminder);
        }
      } else {
        // 如果后端调用失败，使用前端逻辑
        const reminder: Reminder = {
          ...newReminder,
          id: Date.now().toString(),
          isCompleted: false,
        };

        const updatedReminders = [...reminders, reminder];
        setReminders(updatedReminders);

        if (onReminderAdd) {
          onReminderAdd(reminder);
        }
      }

      setNewReminder({
        title: '',
        time: '',
        type: 'medicine',
        description: '',
      });

      setShowAddForm(false);
    } catch (error) {
      console.error('创建提醒失败:', error);
      // 使用前端逻辑作为后备
      const reminder: Reminder = {
        ...newReminder,
        id: Date.now().toString(),
        isCompleted: false,
      };

      const updatedReminders = [...reminders, reminder];
      setReminders(updatedReminders);

      if (onReminderAdd) {
        onReminderAdd(reminder);
      }

      setNewReminder({
        title: '',
        time: '',
        type: 'medicine',
        description: '',
      });

      setShowAddForm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (id: string) => {
    try {
      setIsLoading(true);
      
      // 调用后端API完成提醒
      const response = await callBackendAPI('reminder_complete', {
        reminder_id: id
      });

      if (response.success && response.allReminders) {
        setReminders(response.allReminders);
        
        if (onReminderComplete) {
          onReminderComplete(id);
        }
      } else {
        // 如果后端调用失败，使用前端逻辑
        const updatedReminders = reminders.map(reminder =>
          reminder.id === id
            ? { ...reminder, isCompleted: !reminder.isCompleted }
            : reminder
        );
        setReminders(updatedReminders);

        if (onReminderComplete) {
          onReminderComplete(id);
        }
      }
    } catch (error) {
      console.error('更新提醒状态失败:', error);
      // 使用前端逻辑作为后备
      const updatedReminders = reminders.map(reminder =>
        reminder.id === id
          ? { ...reminder, isCompleted: !reminder.isCompleted }
          : reminder
      );
      setReminders(updatedReminders);

      if (onReminderComplete) {
        onReminderComplete(id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      setIsLoading(true);
      
      // 调用后端API删除提醒
      const response = await callBackendAPI('reminder_delete', {
        reminder_id: id
      });

      if (response.success && response.allReminders) {
        setReminders(response.allReminders);
        
        if (onReminderDelete) {
          onReminderDelete(id);
        }
      } else {
        // 如果后端调用失败，使用前端逻辑
        const updatedReminders = reminders.filter(reminder => reminder.id !== id);
        setReminders(updatedReminders);

        if (onReminderDelete) {
          onReminderDelete(id);
        }
      }
    } catch (error) {
      console.error('删除提醒失败:', error);
      // 使用前端逻辑作为后备
      const updatedReminders = reminders.filter(reminder => reminder.id !== id);
      setReminders(updatedReminders);

      if (onReminderDelete) {
        onReminderDelete(id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 获取提醒类型图标
  const getReminderIcon = (type: ReminderType) => {
    switch (type) {
      case 'medicine':
        return <FaPills className="text-warm-accent" />;
      case 'meal':
        return <FaUtensils className="text-warm-accent" />;
      case 'sleep':
        return <FaBed className="text-warm-accent" />;
      default:
        return <FaBell className="text-warm-accent" />;
    }
  };

  // 按照时间排序
  const sortedReminders = [...reminders].sort((a, b) => a.time.localeCompare(b.time));
  
  // 过滤出今天的重要提醒
  const todayReminders = sortedReminders.filter(reminder => !reminder.isCompleted);

  return (
    <div className={`alzheimer-sidebar-card transition-all duration-300 ease-in-out ${sidebarView ? '' : (isExpanded ? 'min-h-96' : 'h-24 overflow-hidden')}`}>
      {!sidebarView && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold flex items-center">
            <FaBell className="mr-2 text-warm-accent" /> 今日提醒
            {isLoading && <span className="ml-2 text-sm text-warm-text">加载中...</span>}
          </h3>
          <button 
            onClick={toggleExpand} 
            className="alzheimer-button-secondary py-2 px-4 text-base"
            disabled={isLoading}
          >
            {isExpanded ? '收起' : '展开'}
          </button>
        </div>
      )}

      {(isExpanded || sidebarView) && (
        <div className={`${sidebarView ? '' : 'mt-4'}`}>
          <div className="mb-4 flex justify-between items-center">
            {sidebarView && isLoading && <span className="text-xl text-warm-text">加载中...</span>}
            <p className="text-3xl">共 <span className="font-bold text-warm-accent">{todayReminders.length}</span> 项待办提醒</p>
            <button 
              onClick={toggleAddForm}
              className="flex items-center alzheimer-button py-1 px-3 text-xl"
              disabled={isLoading}
            >
              <FaPlus className="mr-1" /> 添加
            </button>
          </div>

          {showAddForm && (
            <div className="bg-warm-secondary p-4 rounded-lg mb-4">
              <h4 className="text-2xl font-semibold mb-2">添加新提醒</h4>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-warm-text mb-1 text-xl">提醒事项</label>
                  <input
                    type="text"
                    name="title"
                    value={newReminder.title}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-warm-accent rounded-lg text-2xl"
                    placeholder="例如：服药、吃饭"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-warm-text mb-1 text-xl">时间</label>
                    <input
                      type="time"
                      name="time"
                      value={newReminder.time}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-warm-accent rounded-lg text-2xl"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-warm-text mb-1 text-xl">类型</label>
                    <select
                      name="type"
                      value={newReminder.type}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-warm-accent rounded-lg text-2xl"
                      disabled={isLoading}
                    >
                      <option value="medicine">服药</option>
                      <option value="meal">用餐</option>
                      <option value="sleep">睡眠</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-warm-text mb-1 text-xl">备注</label>
                  <input
                    type="text"
                    name="description"
                    value={newReminder.description}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-warm-accent rounded-lg text-2xl"
                    placeholder="可选备注"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <button 
                  onClick={toggleAddForm}
                  className="alzheimer-button-secondary py-1 px-3 text-xl"
                  disabled={isLoading}
                >
                  取消
                </button>
                <button 
                  onClick={handleAddReminder}
                  className="alzheimer-button py-1 px-3 text-xl"
                  disabled={isLoading || !newReminder.title || !newReminder.time}
                >
                  {isLoading ? '添加中...' : '添加'}
                </button>
              </div>
            </div>
          )}

          <div className="reminder-list">
            {sortedReminders.length > 0 ? (
              sortedReminders.map(reminder => (
                <div 
                  key={reminder.id} 
                  className={`alzheimer-sidebar-reminder-item mb-4 ${reminder.isCompleted ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center">
                    <div className="mr-3 text-3xl">
                      {getReminderIcon(reminder.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <span className="text-2xl font-semibold truncate">{reminder.title}</span>
                        <span className="ml-2 bg-warm-accent text-white rounded-full px-2 py-0.5 text-xl whitespace-nowrap">
                          {reminder.time}
                        </span>
                      </div>
                      {reminder.description && (
                        <p className="text-xl text-warm-text truncate">{reminder.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-2 ml-6">
                    <button 
                      onClick={() => handleToggleComplete(reminder.id)}
                      className={`py-1 px-2 rounded text-lg ${
                        reminder.isCompleted 
                          ? 'bg-warm-secondary text-warm-text' 
                          : 'bg-warm-success text-white'
                      }`}
                      aria-label={reminder.isCompleted ? '标为未完成' : '标为已完成'}
                      title={reminder.isCompleted ? '标为未完成' : '标为已完成'}
                      disabled={isLoading}
                    >
                      {reminder.isCompleted ? '已完成' : '完成'}
                    </button>
                    <button 
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="py-1 px-2 rounded-full bg-warm-error text-white text-lg"
                      aria-label="删除提醒"
                      title="删除提醒"
                      disabled={isLoading}
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-3 text-warm-text text-xl">
                {isLoading ? '加载中...' : '今天没有提醒事项'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};