import { useState } from 'react';

const TG_BOT_URL = 'https://t.me/placeholder_bot';

export function TelegramBotPopup() {
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-[tg-popup-in_0.35s_ease-out]">
      <div className="relative bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl p-4 w-64 text-white">
        {/* Пульсирующий индикатор */}
        <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500" />
        </span>

        {/* Крестик */}
        <button
          onClick={() => setClosed(true)}
          aria-label="Закрыть"
          className="absolute top-2.5 right-3 text-gray-400 hover:text-white transition-colors text-lg leading-none"
        >
          ✕
        </button>

        <div className="flex items-start gap-3 pr-4">
          <span className="text-2xl mt-0.5">🤖</span>
          <div>
            <p className="font-semibold text-sm leading-tight mb-1">Телеграм-бот кафедры</p>
            <p className="text-gray-400 text-xs leading-snug mb-3">
              Расписание, пересдачи и уведомления прямо в Telegram
            </p>
            <a
              href={TG_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-cyan-600 hover:bg-cyan-500 transition-colors text-white text-xs font-medium px-3 py-1.5 rounded-lg"
            >
              Открыть бота →
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes tg-popup-in {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}
