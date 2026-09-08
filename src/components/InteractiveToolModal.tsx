import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ArcadeLink } from '../types';

interface InteractiveToolModalProps {
  tool: ArcadeLink | null;
  onClose: () => void;
}

export const InteractiveToolModal: React.FC<InteractiveToolModalProps> = ({ tool, onClose }) => {
  if (!tool) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/95 backdrop-blur-xl text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold">
            🎮
          </span>
          <div>
            <h2 className="text-lg font-black text-white">{tool.name}</h2>
            <p className="text-xs text-indigo-300/80 font-medium">{tool.category} • เครื่องมืออินเตอร์แอคทีฟสำหรับห้องเรียน</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <X className="h-4 w-4" />
          <span>ปิดเครื่องมือ</span>
        </button>
      </div>

      {/* Main Tool Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
        {tool.id === 'tool-timer' && <InteractiveTimer />}
        {tool.id === 'tool-lottery' && <InteractiveLottery />}
        {tool.id === 'tool-wheel' && <InteractiveWheel />}
        {tool.id === 'tool-dragon-meter' && <InteractiveDragonMeter />}
        {tool.id === 'tool-popsicle' && <InteractivePopsicle />}
        {tool.id === 'tool-race-timer' && <InteractiveRaceTimer />}
        {tool.id === 'tool-group-sort' && <InteractiveGroupSorter />}
        {tool.id === 'tool-scoreboard' && <InteractiveScoreboard />}
      </div>
    </div>
  );
};

// 1. นาฬิกาจับเวลา (Classroom Timer / Stopwatch)
function InteractiveTimer() {
  const [seconds, setSeconds] = useState(300); // 5 mins default
  const [initialSeconds, setInitialSeconds] = useState(300);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && seconds > 0) {
      interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0 && isRunning) {
      setIsRunning(false);
      alert('⏰ หมดเวลาแล้วครับ!');
    }
    return () => clearInterval(interval);
  }, [isRunning, seconds]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const setPreset = (mins: number) => {
    setIsRunning(false);
    setSeconds(mins * 60);
    setInitialSeconds(mins * 60);
  };

  const progress = initialSeconds > 0 ? (seconds / initialSeconds) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center max-w-lg w-full text-center space-y-8 animate-in fade-in">
      {/* Timer Circle Display */}
      <div className="relative flex items-center justify-center w-72 h-72 rounded-full border-8 border-slate-800 bg-slate-900/80 shadow-2xl">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="144"
            cy="144"
            r="132"
            className="stroke-indigo-500 transition-all duration-1000"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 132}
            strokeDashoffset={2 * Math.PI * 132 * (1 - progress / 100)}
            strokeLinecap="round"
          />
        </svg>
        <div className="flex flex-col items-center z-10">
          <span className="font-mono text-6xl sm:text-7xl font-black tracking-tight text-white">
            {formatTime(seconds)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mt-2">
            {isRunning ? 'กำลังจับเวลา...' : seconds === 0 ? 'หมดเวลา!' : 'พร้อมจับเวลา'}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold shadow-xl transition-all hover:scale-105 active:scale-95 ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          <span>{isRunning ? 'หยุดชั่วคราว' : 'เริ่มจับเวลา'}</span>
        </button>

        <button
          onClick={() => {
            setIsRunning(false);
            setSeconds(initialSeconds);
          }}
          className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-base font-bold transition shadow-lg"
        >
          <RotateCcw className="h-5 w-5" />
          <span>รีเซ็ต</span>
        </button>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[1, 2, 3, 5, 10, 15, 20].map((mins) => (
          <button
            key={mins}
            onClick={() => setPreset(mins)}
            className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-xs font-bold text-slate-300 hover:text-white transition shadow-sm"
          >
            {mins} นาที
          </button>
        ))}
      </div>
    </div>
  );
}

// 2. เครื่องมือสุ่มเลขที่ (Random Number Drum)
function InteractiveLottery() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(40);
  const [picked, setPicked] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<number[]>([]);

  const handleRoll = () => {
    if (min >= max) return;
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      const rand = Math.floor(Math.random() * (max - min + 1)) + min;
      setPicked(rand);
      count++;
      if (count > 20) {
        clearInterval(interval);
        setIsRolling(false);
        setHistory((prev) => [rand, ...prev.slice(0, 9)]);
      }
    }, 60);
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-md w-full text-center space-y-6 animate-in fade-in">
      {/* Range inputs */}
      <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl w-full justify-center text-xs">
        <span>เลขที่เริ่มต้น:</span>
        <input
          type="number"
          value={min}
          onChange={(e) => setMin(Number(e.target.value))}
          className="w-16 bg-slate-800 border border-slate-700 text-center font-bold p-2 rounded-xl text-white"
        />
        <span>ถึงเลขที่:</span>
        <input
          type="number"
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
          className="w-16 bg-slate-800 border border-slate-700 text-center font-bold p-2 rounded-xl text-white"
        />
      </div>

      {/* Lottery Ball Display */}
      <div className="w-56 h-56 rounded-full border-8 border-indigo-500/40 bg-gradient-to-tr from-indigo-900 via-slate-900 to-indigo-950 flex flex-col items-center justify-center shadow-2xl relative">
        <span className="text-7xl font-black text-amber-400 font-mono drop-shadow-lg">
          {picked !== null ? picked : '?'}
        </span>
        <span className="text-xs text-indigo-300 mt-2 font-medium">
          {isRolling ? 'กำลังหมุนสุ่ม...' : 'เลขที่ออก'}
        </span>
      </div>

      <button
        onClick={handleRoll}
        disabled={isRolling}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 font-black text-lg shadow-xl shadow-indigo-500/20 transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
      >
        {isRolling ? 'กำลังสุ่ม...' : '🎲 สุ่มเลขที่เดี๋ยวนี้!'}
      </button>

      {/* History */}
      {history.length > 0 && (
        <div className="w-full bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 text-left">
          <span className="text-xs font-bold text-slate-400 block mb-2">ประวัติเลขที่ออกล่าสุด:</span>
          <div className="flex flex-wrap gap-2">
            {history.map((num, i) => (
              <span key={i} className="px-3 py-1 rounded-lg bg-indigo-950 text-indigo-300 font-mono font-bold text-xs border border-indigo-800">
                {num}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 3. วงล้อสุ่มชื่อ (Wheel of Names)
function InteractiveWheel() {
  const [namesText, setNamesText] = useState('สมชาย\nสมหญิง\nกัญจนา\nวิชัย\nพรทิพย์\nอารยา\nธีรภัทร\nชลธิชา');
  const [winner, setWinner] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const names = namesText.split('\n').map((n) => n.trim()).filter(Boolean);

  const spin = () => {
    if (names.length === 0 || isSpinning) return;
    setIsSpinning(true);
    setWinner(null);
    const randomAngle = Math.floor(Math.random() * 360) + 1440; // at least 4 full spins
    const finalRotation = rotation + randomAngle;
    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const actualAngle = (360 - (finalRotation % 360)) % 360;
      const index = Math.floor((actualAngle / 360) * names.length);
      setWinner(names[index] || names[0]);
    }, 4000);
  };

  const colors = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#38bdf8', '#818cf8', '#c084fc'];

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-10 max-w-4xl w-full">
      {/* Wheel Visual */}
      <div className="relative flex flex-col items-center">
        {/* Pointer */}
        <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-rose-500 z-20 -mb-4 drop-shadow-md" />

        <div
          className="w-72 h-72 sm:w-80 sm:h-80 rounded-full border-8 border-slate-800 shadow-2xl relative overflow-hidden transition-transform duration-4000 cubic-bezier(0.1, 0.9, 0.2, 1)"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {names.map((name, i) => {
            const angle = 360 / names.length;
            const bg = colors[i % colors.length];
            return (
              <div
                key={i}
                className="absolute w-full h-full flex justify-center items-start pt-4 font-bold text-xs text-white"
                style={{
                  transform: `rotate(${i * angle}deg)`,
                  transformOrigin: '50% 50%',
                  background: `conic-gradient(from ${i * angle}deg, ${bg} 0deg, ${bg} ${angle}deg, transparent ${angle}deg)`,
                }}
              >
                <span className="drop-shadow-md transform -rotate-90 mt-8 origin-center truncate max-w-[80px]">
                  {name}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={spin}
          disabled={isSpinning}
          className="mt-6 px-10 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition disabled:opacity-50"
        >
          {isSpinning ? '🎡 กำลังหมุน...' : '🎡 หมุนวงล้อ!'}
        </button>

        {winner && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-lg animate-bounce">
            🎉 ผู้โชคดีคือ: <span className="text-white text-2xl font-black">{winner}</span>
          </div>
        )}
      </div>

      {/* Name Input Box */}
      <div className="w-full lg:w-72 bg-slate-900/80 p-5 rounded-3xl border border-slate-800 text-left">
        <label className="block text-xs font-bold text-slate-300 mb-2">รายชื่อนักเรียน (บรรทัดละ 1 คน):</label>
        <textarea
          rows={10}
          value={namesText}
          onChange={(e) => setNamesText(e.target.value)}
          className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-indigo-500 resize-none"
        />
        <span className="text-[11px] text-slate-500 mt-1 block">มีรายชื่อทั้งหมด: {names.length} คน</span>
      </div>
    </div>
  );
}

// 4. มังกรพ่นไฟ เปิดเครื่องวัดเสียง (Sound/Noise Meter using Microphone API)
function InteractiveDragonMeter() {
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(15);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      setIsListening(true);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setVolume(normalized);
        animFrameRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (e) {
      alert('ไม่สามารถเปิดใช้งานไมโครโฟนได้ หรือไม่อนุญาตการเข้าถึง');
    }
  };

  const stopListening = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    setIsListening(false);
    setVolume(10);
  };

  const isLoud = volume > 50;

  return (
    <div className="flex flex-col items-center justify-center max-w-lg w-full text-center space-y-8 animate-in fade-in">
      <div className="relative flex flex-col items-center">
        {/* Dragon Animation */}
        <div className={`text-9xl transition-transform duration-300 ${isLoud ? 'scale-125 animate-shake' : 'scale-100'}`}>
          {isLoud ? '🐲🔥' : '🐉'}
        </div>

        <span className={`text-2xl font-black mt-4 ${isLoud ? 'text-rose-400' : 'text-emerald-400'}`}>
          {isLoud ? '⚠️ เสียงดังเกินไปแล้ว! มังกรพ่นไฟ!' : '😊 ห้องเรียนเงียบสงบ ดีมากครับ'}
        </span>
      </div>

      {/* Volume Bar */}
      <div className="w-full bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex justify-between text-xs font-bold text-slate-400">
          <span>ระดับเสียง: {volume}%</span>
          <span>เกณฑ์เสียงดัง: 50%</span>
        </div>
        <div className="w-full h-8 rounded-full bg-slate-800 overflow-hidden p-1 border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              isLoud ? 'bg-gradient-to-r from-amber-500 to-rose-600' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
            }`}
            style={{ width: `${volume}%` }}
          />
        </div>
      </div>

      <button
        onClick={isListening ? stopListening : startListening}
        className={`px-8 py-3.5 rounded-2xl font-bold text-base shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
          isListening ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {isListening ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        <span>{isListening ? 'ปิดตรวจจับเสียง' : '🎤 เปิดไมโครโฟนตรวจจับเสียง'}</span>
      </button>
    </div>
  );
}

// 5. ไม้ไอติมสุ่มชื่อ (Popsicle Picker)
function InteractivePopsicle() {
  const [namesText, setNamesText] = useState('เด็กชายกิตติศักดิ์\nเด็กหญิงณิชารีย์\nเด็กชายธนากร\nเด็กหญิงวรรณษา\nเด็กชายปิยวัฒน์\nเด็กหญิงศิริพร');
  const [drawn, setDrawn] = useState<string | null>(null);
  const names = namesText.split('\n').map((n) => n.trim()).filter(Boolean);

  const drawOne = () => {
    if (names.length === 0) return;
    const rand = names[Math.floor(Math.random() * names.length)];
    setDrawn(rand);
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-md w-full text-center space-y-6 animate-in fade-in">
      <div className="text-8xl select-none animate-bounce">🍧</div>

      {drawn && (
        <div className="p-6 rounded-3xl bg-indigo-600 text-white shadow-2xl border-4 border-indigo-400 w-full animate-in zoom-in-50">
          <span className="text-xs uppercase tracking-widest text-indigo-200 block mb-1">ไม้ไอติมที่หยิบได้:</span>
          <span className="text-2xl font-black">{drawn}</span>
        </div>
      )}

      <button
        onClick={drawOne}
        className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-lg shadow-xl transition-all hover:scale-102 active:scale-98"
      >
        ✨ สุ่มหยิบไม้ไอติม 1 อัน!
      </button>

      <div className="w-full text-left">
        <label className="text-xs font-bold text-slate-400 mb-1 block">แก้ไขรายชื่อนักเรียนในกระบอก:</label>
        <textarea
          value={namesText}
          onChange={(e) => setNamesText(e.target.value)}
          rows={3}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          placeholder="รายชื่อนักเรียน (1 คนต่อ 1 บรรทัด)"
        />
      </div>
    </div>
  );
}

// 6. แข่งขันวิ่งคาปิบารา (Capybara Race Timer)
function InteractiveRaceTimer() {
  const [positions, setPositions] = useState([0, 0, 0, 0]);
  const [isRacing, setIsRacing] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);

  const racers = ['คาปิบารา 1 🐹', 'เป็ดน้อย 2 🦆', 'เต่าซ่า 3 🐢', 'กระต่าย 4 🐇'];

  const startRace = () => {
    setPositions([0, 0, 0, 0]);
    setWinner(null);
    setIsRacing(true);

    const interval = setInterval(() => {
      setPositions((prev) => {
        const next = prev.map((p) => p + Math.floor(Math.random() * 8) + 2);
        const winIdx = next.findIndex((p) => p >= 90);
        if (winIdx !== -1) {
          clearInterval(interval);
          setIsRacing(false);
          setWinner(winIdx);
        }
        return next;
      });
    }, 100);
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-xl w-full text-center space-y-6 animate-in fade-in">
      <h3 className="text-xl font-bold text-amber-400">🏁 เกมแข่งขันวิ่งตัวการ์ตูน</h3>

      <div className="w-full bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 text-left">
        {racers.map((name, i) => (
          <div key={i} className="relative h-12 bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 flex items-center px-4">
            <span className="text-xs font-bold text-slate-400 z-10 w-28 truncate">{name}</span>
            <div
              className="absolute text-3xl transition-all duration-100 ease-linear"
              style={{ left: `${Math.min(85, positions[i])}%` }}
            >
              🏁
            </div>
          </div>
        ))}
      </div>

      {winner !== null && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-lg animate-bounce">
          🏆 ผู้ชนะคือ: <span className="text-white text-2xl font-black">{racers[winner]}</span>!
        </div>
      )}

      <button
        onClick={startRace}
        disabled={isRacing}
        className="px-10 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl transition disabled:opacity-50"
      >
        {isRacing ? 'กำลังวิ่งแข่ง...' : '🚩 ปล่อยตัวนักวิ่ง!'}
      </button>
    </div>
  );
}

// 7. จัดกลุ่มนักเรียน (Student Group Sorter)
function InteractiveGroupSorter() {
  const [namesText, setNamesText] = useState('กัญจนา\nสมชาย\nสมหญิง\nศิริพร\nวิชัย\nพรทิพย์\nปิยวัฒน์\nชลธิชา\nธีรภัทร\nอนันต์\nสุชาติ\nพัชรา');
  const [numGroups, setNumGroups] = useState(3);
  const [groups, setGroups] = useState<string[][]>([]);

  const makeGroups = () => {
    const list = namesText.split('\n').map((n) => n.trim()).filter(Boolean);
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    const res: string[][] = Array.from({ length: numGroups }, () => []);
    shuffled.forEach((name, i) => {
      res[i % numGroups].push(name);
    });
    setGroups(res);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-4xl w-full text-center">
      {/* Input */}
      <div className="w-full lg:w-72 bg-slate-900/80 p-5 rounded-3xl border border-slate-800 text-left space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2">รายชื่อนักเรียน:</label>
          <textarea
            rows={8}
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">จำนวนกลุ่มที่ต้องการ:</label>
          <select
            value={numGroups}
            onChange={(e) => setNumGroups(Number(e.target.value))}
            className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white"
          >
            {[2, 3, 4, 5, 6, 8].map((g) => (
              <option key={g} value={g}>{g} กลุ่ม</option>
            ))}
          </select>
        </div>

        <button
          onClick={makeGroups}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-sm text-white shadow-lg transition"
        >
          ✨ สุ่มแบ่งกลุ่ม
        </button>
      </div>

      {/* Result Groups */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {groups.map((group, idx) => (
          <div key={idx} className="bg-slate-900/80 p-5 rounded-3xl border border-indigo-500/30 text-left space-y-2">
            <h4 className="font-black text-indigo-400 text-sm flex items-center justify-between">
              <span>กลุ่มที่ {idx + 1}</span>
              <span className="text-xs text-slate-500">({group.length} คน)</span>
            </h4>
            <ul className="divide-y divide-slate-800 text-xs text-slate-200">
              {group.map((name, i) => (
                <li key={i} className="py-1.5 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// 8. ป้ายคะแนนดิจิทัล (Digital Scoreboard)
function InteractiveScoreboard() {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [period, setPeriod] = useState(1);

  return (
    <div className="flex flex-col items-center justify-center max-w-2xl w-full text-center space-y-8 animate-in fade-in">
      <div className="grid grid-cols-2 gap-6 w-full">
        {/* Home */}
        <div className="bg-slate-900 p-6 rounded-3xl border-2 border-indigo-500/40 shadow-2xl flex flex-col items-center">
          <span className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-2">HOME (ทีมสีฟ้า)</span>
          <span className="font-mono text-7xl sm:text-8xl font-black text-white my-4">{homeScore}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setHomeScore((s) => Math.max(0, s - 1))}
              className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xl flex items-center justify-center"
            >
              -
            </button>
            <button
              onClick={() => setHomeScore((s) => s + 1)}
              className="w-16 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-2xl flex items-center justify-center shadow-lg"
            >
              +1
            </button>
            <button
              onClick={() => setHomeScore((s) => s + 2)}
              className="w-12 h-12 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center"
            >
              +2
            </button>
          </div>
        </div>

        {/* Away */}
        <div className="bg-slate-900 p-6 rounded-3xl border-2 border-rose-500/40 shadow-2xl flex flex-col items-center">
          <span className="text-sm font-black text-rose-400 uppercase tracking-widest mb-2">AWAY (ทีมสีแดง)</span>
          <span className="font-mono text-7xl sm:text-8xl font-black text-white my-4">{awayScore}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setAwayScore((s) => Math.max(0, s - 1))}
              className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xl flex items-center justify-center"
            >
              -
            </button>
            <button
              onClick={() => setAwayScore((s) => s + 1)}
              className="w-16 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-2xl flex items-center justify-center shadow-lg"
            >
              +1
            </button>
            <button
              onClick={() => setAwayScore((s) => s + 2)}
              className="w-12 h-12 rounded-xl bg-rose-800 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center"
            >
              +2
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl">
          <span className="text-amber-400 font-bold text-xs">ช่วง (PERIOD): {period}</span>
          <button
            onClick={() => setPeriod((p) => (p >= 4 ? 1 : p + 1))}
            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-xs"
          >
            เปลี่ยนช่วง
          </button>
        </div>

        <button
          onClick={() => {
            setHomeScore(0);
            setAwayScore(0);
            setPeriod(1);
          }}
          className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
        >
          รีเซ็ตทั้งหมด
        </button>
      </div>
    </div>
  );
}
