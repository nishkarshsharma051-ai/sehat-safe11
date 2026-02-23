import { useEffect, useState, useRef, useCallback } from 'react';
import { Send, Bot, User as UserIcon, Loader, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage } from '../../types';
import { chatService, healthProfileService } from '../../services/dataService';
import { getGeminiResponse } from '../../services/geminiService';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ChatBot() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [userProfile, setUserProfile] = useState<unknown>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const loadChatHistory = useCallback(async () => {
    try {
      const history = await chatService.getHistory(user?.uid || 'anonymous');
      setMessages(history);

      if (user?.uid) {
        const profile = await healthProfileService.get(user.uid);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !user) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Show user message immediately
    const tempId = Date.now().toString();
    const tempMsg: ChatMessage = {
      id: tempId,
      user_id: user.uid,
      message: userMessage,
      response: '',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      // Build conversation history for context
      const history = messages
        .filter(m => m.response)
        .map(m => ({ message: m.message, response: m.response }));

      const aiResponse = await getGeminiResponse(userMessage, history, {
        name: user?.displayName || 'Guest',
        role: (user as { role?: string }).role || 'patient',
        age: (userProfile as { age?: number })?.age,
        gender: (userProfile as { gender?: string })?.gender,
        bloodGroup: (userProfile as { blood_group?: string })?.blood_group,
        allergies: (userProfile as { allergies?: string[] })?.allergies,
        conditions: (userProfile as { chronic_conditions?: string[] })?.chronic_conditions,
        language: lang === 'hi' ? 'Hindi' : 'English' // Hint the AI
      });

      const finalMsg: ChatMessage = {
        id: tempId,
        user_id: user.uid,
        message: userMessage,
        response: aiResponse,
        created_at: new Date().toISOString(),
      };

      await chatService.addMessage(finalMsg);
      setMessages(prev => prev.map(m => m.id === tempId ? finalMsg : m));
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'What should I do for a headache?',
    'How to manage fever?',
    'Tips for better sleep',
    'How to reduce stress?',
  ];

  if (loadingHistory) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-gray-600">{t('Loading chat...', 'चैट लोड हो रही है...')}</p>
      </div>
    );
  }

  return (
    <div className="glass-card flex flex-col h-[600px] w-full">
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-green-500 p-2 rounded-xl">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{t('Sehat Safe AI Assistant', 'सेहत सेफ एआई सहायक')}</h3>
            <p className="text-sm text-gray-600 flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-yellow-500" />
              {t('Powered by Google Gemini AI', 'गूगल जेमिनी एआई द्वारा संचालित')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-4">
            <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">{t("Hi! I'm your AI Health Assistant", "नमस्ते! मैं आपका एआई स्वास्थ्य सहायक हूँ")}</h3>
            <p className="text-gray-500 mb-6">{t('Ask me about symptoms, medications, or health tips', 'मुझसे लक्षणों, दवाओं या स्वास्थ्य युक्तियों के बारे में पूछें')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
              {quickQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(question);
                  }}
                  className="text-left p-3 rounded-xl bg-white/30 hover:bg-white/50 text-sm text-gray-700 transition-all border border-white/20"
                >
                  {t(question,
                    question === 'What should I do for a headache?' ? 'सिरदर्द के लिए मुझे क्या करना चाहिए?' :
                      question === 'How to manage fever?' ? 'बुखार का प्रबंधन कैसे करें?' :
                        question === 'Tips for better sleep' ? 'बेहतर नींद के टिप्स' :
                          question === 'How to reduce stress?' ? 'तनाव कैसे कम करें?' : question
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <div className="flex items-start space-x-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-xl flex-shrink-0">
                <UserIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 bg-blue-50/80 rounded-2xl rounded-tl-none p-4">
                <p className="text-gray-800">{msg.message}</p>
              </div>
            </div>

            {msg.response && (
              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-green-500 p-2 rounded-xl flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 bg-white/50 rounded-2xl rounded-tl-none p-4 border border-white/20 overflow-x-auto">
                  <div className="text-gray-800 text-sm leading-relaxed markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ ...props }) => <table className="w-full border-collapse my-4" {...props} />,
                        thead: ({ ...props }) => <thead className="bg-blue-50/50" {...props} />,
                        th: ({ ...props }) => <th className="border border-blue-100 px-4 py-2 text-left font-semibold text-blue-800" {...props} />,
                        td: ({ ...props }) => <td className="border border-blue-100 px-4 py-2" {...props} />,
                        ul: ({ ...props }) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
                        ol: ({ ...props }) => <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />,
                        li: ({ ...props }) => <li className="pl-1" {...props} />,
                        strong: ({ ...props }) => <strong className="font-bold text-blue-900" {...props} />,
                      }}
                    >
                      {msg.response}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-green-500 p-2 rounded-xl flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 bg-white/50 rounded-2xl rounded-tl-none p-4 border border-white/20">
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 text-gray-600 animate-spin" />
                <span className="text-sm text-gray-500">{t('Thinking...', 'सोच रहा हूँ...')}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t border-white/20">
        <form onSubmit={sendMessage} className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={t('Ask a health question...', 'स्वास्थ्य संबंधी प्रश्न पूछें...')}
            className="flex-1 px-4 py-3 rounded-xl glass-input"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span>{t('Send', 'भेजें')}</span>
          </button>
        </form>
      </div>
    </div >
  );
}
