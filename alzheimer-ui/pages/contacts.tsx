import { useState } from 'react';
import Head from 'next/head';
import { FaUser, FaPhone, FaVideo, FaEnvelope, FaStar, FaHeart, FaUserMd, FaHome } from 'react-icons/fa';
import AlzheimerNav from '../components/Navigation/AlzheimerNav';

// 联系人类型
type ContactType = 'family' | 'medical' | 'emergency' | 'friend';

// 联系人接口
interface Contact {
  id: string;
  name: string;
  relation: string;
  type: ContactType;
  phoneNumber: string;
  email?: string;
  address?: string;
  photoUrl: string;
  isFavorite: boolean;
}

export default function Contacts() {
  // 切换字体大小
  const [fontSizeMode, setFontSizeMode] = useState('normal');
  const toggleFontSize = () => {
    setFontSizeMode(prev => prev === 'normal' ? 'large' : 'normal');
  };

  // 联系人过滤
  const [filter, setFilter] = useState<ContactType | 'all'>('all');

  // 模拟联系人数据
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: '1',
      name: '张小明',
      relation: '儿子',
      type: 'family',
      phoneNumber: '138-1234-5678',
      email: 'xiaoming@example.com',
      address: '北京市朝阳区建国路88号',
      photoUrl: '/contacts/son.jpg',
      isFavorite: true,
    },
    {
      id: '2',
      name: '李小红',
      relation: '女儿',
      type: 'family',
      phoneNumber: '139-8765-4321',
      email: 'xiaohong@example.com',
      address: '上海市浦东新区张杨路500号',
      photoUrl: '/contacts/daughter.jpg',
      isFavorite: true,
    },
    {
      id: '3',
      name: '王医生',
      relation: '主治医师',
      type: 'medical',
      phoneNumber: '133-1111-2222',
      email: 'doctor.wang@hospital.com',
      address: '北京协和医院神经内科',
      photoUrl: '/contacts/doctor.jpg',
      isFavorite: false,
    },
    {
      id: '4',
      name: '李护士',
      relation: '护理人员',
      type: 'medical',
      phoneNumber: '135-3333-4444',
      photoUrl: '/contacts/nurse.jpg',
      isFavorite: false,
    },
    {
      id: '5',
      name: '紧急救助中心',
      relation: '急救服务',
      type: 'emergency',
      phoneNumber: '120',
      address: '全国通用急救电话',
      photoUrl: '/contacts/emergency.jpg',
      isFavorite: true,
    },
    {
      id: '6',
      name: '老张',
      relation: '好友',
      type: 'friend',
      phoneNumber: '136-5555-6666',
      address: '北京市海淀区中关村南大街',
      photoUrl: '/contacts/friend.jpg',
      isFavorite: false,
    },
  ]);

  // 处理拨打电话
  const handleCall = (phoneNumber: string, name: string) => {
    alert(`正在呼叫 ${name}: ${phoneNumber}`);
    // 实际项目中应该集成电话API
  };

  // 处理视频通话
  const handleVideoCall = (phoneNumber: string, name: string) => {
    alert(`正在发起与 ${name} 的视频通话`);
    // 实际项目中应该集成视频通话API
  };

  // 处理发送邮件
  const handleEmail = (email: string, name: string) => {
    alert(`正在准备给 ${name} 发送邮件: ${email}`);
    // 实际项目中应该集成邮件API
  };

  // 处理收藏/取消收藏联系人
  const toggleFavorite = (id: string) => {
    setContacts(contacts.map(contact => 
      contact.id === id 
        ? { ...contact, isFavorite: !contact.isFavorite } 
        : contact
    ));
  };

  // 根据过滤条件筛选联系人
  const filteredContacts = filter === 'all' 
    ? contacts 
    : contacts.filter(contact => contact.type === filter);

  // 按收藏状态和名称排序
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    // 首先按收藏状态排序
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    // 然后按姓名排序
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={`min-h-screen bg-warm-primary pb-24 ${fontSizeMode === 'large' ? 'large-font' : ''}`}>
      <Head>
        <title>联系人 - 阿尔茨海默症智能陪伴助手</title>
        <meta name="description" content="阿尔茨海默症智能陪伴助手联系人列表" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-4xl font-bold text-warm-text">我的联系人</h1>
          <button
            onClick={toggleFontSize}
            className="alzheimer-button-secondary py-2 px-4"
            aria-label="切换字体大小"
          >
            {fontSizeMode === 'normal' ? '放大字体' : '恢复字体'}
          </button>
        </header>

        {/* 过滤器 */}
        <div className="bg-warm-secondary rounded-xl p-4 mb-6 shadow-warm flex flex-wrap justify-center gap-3">
          <button 
            onClick={() => setFilter('all')}
            className={`py-2 px-4 rounded-full text-xl font-medium ${
              filter === 'all' 
                ? 'bg-warm-accent text-white' 
                : 'bg-white text-warm-text hover:bg-warm-accent hover:text-white'
            }`}
          >
            全部联系人
          </button>
          <button 
            onClick={() => setFilter('family')}
            className={`py-2 px-4 rounded-full text-xl font-medium flex items-center ${
              filter === 'family' 
                ? 'bg-warm-accent text-white' 
                : 'bg-white text-warm-text hover:bg-warm-accent hover:text-white'
            }`}
          >
            <FaHome className="mr-2" /> 家人
          </button>
          <button 
            onClick={() => setFilter('medical')}
            className={`py-2 px-4 rounded-full text-xl font-medium flex items-center ${
              filter === 'medical' 
                ? 'bg-warm-accent text-white' 
                : 'bg-white text-warm-text hover:bg-warm-accent hover:text-white'
            }`}
          >
            <FaUserMd className="mr-2" /> 医护人员
          </button>
          <button 
            onClick={() => setFilter('emergency')}
            className={`py-2 px-4 rounded-full text-xl font-medium flex items-center ${
              filter === 'emergency' 
                ? 'bg-warm-accent text-white' 
                : 'bg-white text-warm-text hover:bg-warm-accent hover:text-white'
            }`}
          >
            <FaPhone className="mr-2" /> 紧急联系
          </button>
          <button 
            onClick={() => setFilter('friend')}
            className={`py-2 px-4 rounded-full text-xl font-medium flex items-center ${
              filter === 'friend' 
                ? 'bg-warm-accent text-white' 
                : 'bg-white text-warm-text hover:bg-warm-accent hover:text-white'
            }`}
          >
            <FaUser className="mr-2" /> 朋友
          </button>
        </div>

        {/* 联系人列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedContacts.map(contact => (
            <div key={contact.id} className="bg-white rounded-xl overflow-hidden shadow-warm-lg">
              <div className="flex p-4">
                {/* 联系人照片 */}
                <div className="w-24 h-24 rounded-full overflow-hidden bg-warm-secondary flex-shrink-0 border-4 border-warm-secondary">
                  <div className="w-full h-full relative bg-warm-accent flex items-center justify-center text-white text-4xl">
                    {contact.photoUrl ? (
                      <img 
                        src={contact.photoUrl} 
                        alt={contact.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // 照片加载失败时显示首字母
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      contact.name.charAt(0)
                    )}
                  </div>
                </div>

                {/* 联系人信息 */}
                <div className="ml-4 flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">{contact.name}</h2>
                      <p className="text-xl text-warm-text-light">{contact.relation}</p>
                    </div>
                    <button 
                      onClick={() => toggleFavorite(contact.id)}
                      className={`p-2 rounded-full ${
                        contact.isFavorite 
                          ? 'text-warm-accent' 
                          : 'text-warm-text-light'
                      }`}
                      aria-label={contact.isFavorite ? '取消收藏' : '收藏'}
                      title={contact.isFavorite ? '取消收藏' : '收藏'}
                    >
                      {contact.isFavorite ? <FaHeart size={24} /> : <FaStar size={24} />}
                    </button>
                  </div>
                  <p className="text-xl my-2">{contact.phoneNumber}</p>
                  {contact.address && (
                    <p className="text-lg text-warm-text-light truncate">{contact.address}</p>
                  )}
                </div>
              </div>

              {/* 联系按钮 */}
              <div className="flex border-t border-warm-secondary">
                <button 
                  onClick={() => handleCall(contact.phoneNumber, contact.name)}
                  className="flex-1 py-3 text-center bg-warm-secondary text-warm-text hover:bg-warm-accent hover:text-white transition-colors flex items-center justify-center"
                >
                  <FaPhone className="mr-2" /> 电话
                </button>
                <button 
                  onClick={() => handleVideoCall(contact.phoneNumber, contact.name)}
                  className="flex-1 py-3 text-center bg-warm-secondary text-warm-text hover:bg-warm-accent hover:text-white transition-colors border-l border-white flex items-center justify-center"
                >
                  <FaVideo className="mr-2" /> 视频
                </button>
                {contact.email && (
                  <button 
                    onClick={() => handleEmail(contact.email!, contact.name)}
                    className="flex-1 py-3 text-center bg-warm-secondary text-warm-text hover:bg-warm-accent hover:text-white transition-colors border-l border-white flex items-center justify-center"
                  >
                    <FaEnvelope className="mr-2" /> 邮件
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-2xl text-warm-text">没有找到符合条件的联系人</p>
          </div>
        )}
      </main>

      <AlzheimerNav />
    </div>
  );
}