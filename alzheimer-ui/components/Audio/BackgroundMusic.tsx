import { useEffect, useRef, useState } from 'react';
import { FaMusic, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface BackgroundMusicProps {
  autoplay?: boolean;
  volume?: number;
  loop?: boolean;
}

export const BackgroundMusic: React.FC<BackgroundMusicProps> = ({
  autoplay = true,
  volume = 0.3, // 默认较低音量
  loop = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [musicList] = useState([
    '/audio/relaxing_piano.mp3',
    '/audio/gentle_waves.mp3',
    '/audio/forest_sounds.mp3',
  ]);
  const [currentMusicIndex, setCurrentMusicIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 初始化音频元素
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio(musicList[currentMusicIndex]);
      audio.volume = currentVolume;
      audio.loop = loop;
      audioRef.current = audio;

      // 初始状态设置
      if (autoplay) {
        const playPromise = audio.play();
        
        // 处理自动播放限制
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(error => {
              // 自动播放被浏览器阻止
              setIsPlaying(false);
              console.log('自动播放被阻止，需要用户交互来播放音乐', error);
            });
        }
      }

      // 监听音乐结束事件，播放下一首
      audio.addEventListener('ended', handleNextTrack);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleNextTrack);
      }
    };
  }, []);

  // 处理音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : currentVolume;
    }
  }, [currentVolume, isMuted]);

  // 切换播放/暂停
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 切换静音
  const toggleMute = () => {
    if (!audioRef.current) return;

    setIsMuted(!isMuted);
    audioRef.current.volume = !isMuted ? 0 : currentVolume;
  };

  // 调整音量
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setCurrentVolume(newVolume);

    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume;
    }
  };

  // 播放下一首
  const handleNextTrack = () => {
    if (!audioRef.current || !loop) return;

    const nextIndex = (currentMusicIndex + 1) % musicList.length;
    setCurrentMusicIndex(nextIndex);

    audioRef.current.src = musicList[nextIndex];
    audioRef.current.load();
    audioRef.current.play();
  };

  return (
    <div className="fixed bottom-4 left-4 flex items-center bg-warm-secondary bg-opacity-90 rounded-full py-2 px-4 shadow-warm z-50">
      <button
        onClick={togglePlay}
        className={`p-2 rounded-full transition-all duration-200 ${
          isPlaying
            ? 'bg-warm-accent text-white'
            : 'bg-white text-warm-button hover:bg-warm-accent'
        }`}
        aria-label={isPlaying ? '暂停背景音乐' : '播放背景音乐'}
        title={isPlaying ? '暂停背景音乐' : '播放背景音乐'}
      >
        <FaMusic size={18} />
      </button>

      <button
        onClick={toggleMute}
        className={`p-2 ml-2 rounded-full transition-all duration-200 ${
          isMuted
            ? 'bg-warm-error text-white'
            : 'bg-white text-warm-button hover:bg-warm-accent'
        }`}
        aria-label={isMuted ? '取消静音' : '静音'}
        title={isMuted ? '取消静音' : '静音'}
      >
        {isMuted ? (
          <FaVolumeMute size={18} />
        ) : (
          <FaVolumeUp size={18} />
        )}
      </button>

      <div className="ml-3 w-24">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={currentVolume}
          onChange={handleVolumeChange}
          className="w-full h-2 bg-warm-accent rounded-lg appearance-none cursor-pointer"
          aria-label="音量调节"
        />
      </div>
    </div>
  );
};