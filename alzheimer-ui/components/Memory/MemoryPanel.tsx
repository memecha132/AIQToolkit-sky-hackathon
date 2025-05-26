import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaCamera, FaCalendarAlt, FaUserFriends } from 'react-icons/fa';

interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  imageUrl: string;
  people: string[];
  tags: string[];
}

interface MemoryPanelProps {
  memories?: Memory[];
  onMemoryClick?: (memory: Memory) => void;
  sidebarView?: boolean; // 新增：是否为侧边栏视图
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  memories = [],
  onMemoryClick,
  sidebarView = true, // 默认为侧边栏视图
}) => {
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isExpanded, setIsExpanded] = useState(sidebarView); // 在侧边栏中默认展开

  // 模拟记忆数据
  const [localMemories, setLocalMemories] = useState<Memory[]>([
    {
      "id": "1",
      "title": "全家长城之行",
      "description": "2017年11月，晴朗秋日，全家五口相聚一堂，共同探访了位于北京的八达岭长城。家人们穿着暖和的秋装，手臂相挽，笑逐颜开，背景是长城蜿蜒的险峻山石。照片中可见路人逐渐消失在长城转角，男孩兴奋地指向登城石阶，长辈稳步而上，记录下了家庭团聚的欢快时刻。",
      "date": "2017-11-01",
      "imageUrl": "/memories/2017年11月全家一起去长城.jpg",
      "people": [
        "张三",
        "李四",
        "王五",
        "赵六"
      ],
      "tags": [
        "家庭聚会",
        "长城旅游",
        "秋日出游",
        "亲子时光"
      ]
    },
    {
      "id": "2",
      "title": "2018年家庭踏青",
      "description": "2018年5月和家人一起到近郊踏青，享受美好时光。",
      "date": "2018-05-01",
      "imageUrl": "/memories/2018年5月和家人一起踏青.jpg",
      "people": [
        "家人"
      ],
      "tags": [
        "家庭活动",
        "户外踏青",
        "2018年"
      ]
    },
    {
      "id": "3",
      "title": "家庭聚餐",
      "description": "2020年3月与家人共度温馨晚餐，记录家庭喜悦时刻。",
      "date": "2020-03-01",
      "imageUrl": "/memories/2020年3月和家人一起吃饭.jpg",
      "people": [
        "父母",
        "兄弟姐妹"
      ],
      "tags": [
        "家庭",
        "聚会",
        "晚餐"
      ]
    },
    {
    "id": "4",
    "title": "天安门之行",
    "description": "2023年7月，全家共同前往北京天安门，享受国家象征地标的壮观景色，体验革命历史与资本。",
    "date": "2023-07-01",
    "imageUrl": "/memories/2023年7月全家一起去天安门.jpg",
    "people": [
      "张三",
      "李四",
      "王五"
    ],
    "tags": [
      "旅行",
      "北京",
      "天安门",
      "家庭"
    ]
  },
    {
      "id": "5",
      "title": "朋友1-张三",
      "description": "与好友张三共度的时光，记录友情瞬间，时间：2023年1月1日，地点：家中",
      "date": "2023-01-01",
      "imageUrl": "/memories/朋友1-张三.jpg",
      "people": [
        "张三"
      ],
      "tags": [
        "友情",
        "聚会",
        "日常记录"
      ]
    },
    {
      "id": "6",
      "title": "朋友2-李四",
      "description": "与好友李四共同度过的美好时光，记录了友情和快乐的瞬间，时间：2023年5月20日，地点：城市公园",
      "date": "2023-05-20",
      "imageUrl": "/memories/朋友2-李四.jpg",
      "people": [
        "李四"
      ],
      "tags": [
        "朋友",
        "快乐时光",
        "城市公园",
        "2023年5月"
      ]
    },
    {
      "id": "7",
      "title": "朋友3-小丽",
      "description": "和小丽的第一次相识，记录了我们之间的友谊和快乐的瞬间，时间：2023年8月15日，地点：海边",
      "date": "",
      "imageUrl": "/memories/朋友3-小丽.jpg",
      "people": [
        "小丽"
      ],
      "tags": [
        "朋友"
      ]
    }
  ]);

  useEffect(() => {
    if (memories && memories.length > 0) {
      setLocalMemories(memories);
    }
  }, [memories]);

  // 语音合成播放 description
  const speakDescription = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN'; // 设置中文
      utterance.rate = 1; // 语速
      utterance.pitch = 1; // 音调
      window.speechSynthesis.cancel(); // 取消之前的播放
      window.speechSynthesis.speak(utterance);
    } else {
      alert('您的浏览器不支持语音合成功能');
    }
  };

  const handleMemoryClick = (memory: Memory) => {
    setSelectedMemory(memory);
    if (onMemoryClick) {
      onMemoryClick(memory);
    }
    speakDescription(memory.description); // 点击时播放语音
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    // 收起时停止朗读
    if (isExpanded) {
      window.speechSynthesis.cancel();
    }
  };

  const handleBackToList = () => {
    setSelectedMemory(null);
    window.speechSynthesis.cancel(); // 返回列表时停止朗读
  };

  return (
    <div className={`alzheimer-sidebar-card transition-all duration-300 ease-in-out ${sidebarView ? '' : (isExpanded ? 'h-96' : 'h-24 overflow-hidden')}`}>
      {!sidebarView && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold flex items-center">
            <FaCamera className="mr-2 text-warm-accent" /> 记忆回溯
          </h3>
          <button
            onClick={toggleExpand}
            className="alzheimer-button-secondary py-2 px-4 text-base"
          >
            {isExpanded ? '收起' : '展开'}
          </button>
        </div>
      )}

      {(isExpanded || sidebarView) && (
        <div className={`${sidebarView ? '' : 'mt-4'}`}>
          {selectedMemory ? (
            <div className="memory-detail">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-3xl font-bold">{selectedMemory.title}</h4>
                <button
                  onClick={handleBackToList}
                  className="text-warm-button hover:text-warm-button-hover text-xl"
                >
                  返回
                </button>
              </div>

              <div className="relative w-full mb-4 rounded-lg overflow-hidden" style={{paddingBottom: "56.25%"}}>
                <Image
                  src={selectedMemory.imageUrl}
                  alt={selectedMemory.title}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
              </div>

              <div className="flex items-center text-xl mb-3">
                <FaCalendarAlt className="mr-1 text-warm-accent" />
                <span>{selectedMemory.date}</span>
                <FaUserFriends className="ml-3 mr-1 text-warm-accent" />
                <span>{selectedMemory.people.join(', ')}</span>
              </div>

              <p className="text-2xl mb-3 overflow-y-auto max-h-40">{selectedMemory.description}</p>

              <div className="mt-3 flex flex-wrap">
                {selectedMemory.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-warm-secondary text-warm-text px-2 py-0.5 rounded-full text-xl mr-2 mb-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-3xl">共 <span className="font-bold text-warm-accent">{localMemories.length}</span> 个记忆</p>
              </div>
              
              <div className={`grid ${sidebarView ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'} gap-4`}>
                {localMemories.map((memory) => (
                  <div
                    key={memory.id}
                    className="alzheimer-sidebar-memory-card cursor-pointer"
                    onClick={() => handleMemoryClick(memory)}
                  >
                    <div className="relative w-full rounded-t-lg overflow-hidden" style={{paddingBottom: "56.25%"}}>
                      <Image
                        src={memory.imageUrl}
                        alt={memory.title}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-2xl truncate">{memory.title}</h4>
                      <div className="flex items-center text-xl text-warm-text mt-2">
                        <FaCalendarAlt className="mr-1 text-warm-accent" />
                        <span>{memory.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};