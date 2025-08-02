// Frontend/mi-tienda-pintura/src/components/Chatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import Spinner from './Spinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: '¡Hola! Soy Mercurio Asistente. ¿Cómo puedo ayudarte a encontrar la pintura perfecta para tu proyecto?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const history = messages.map(msg => ({ role: msg.role, text: msg.text }));
            
            const response = await fetch(`${API_URL}/api/chatbot/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input, history }),
            });

            if (!response.ok) {
                throw new Error('No se pudo obtener una respuesta del asistente.');
            }

            const data = await response.json();
            const botMessage = { role: 'bot', text: data.reply };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            const errorMessage = { role: 'bot', text: 'Lo siento, estoy teniendo problemas para conectarme. Por favor, intenta de nuevo más tarde.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-[#0F3460] text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-50"
                aria-label="Abrir chat de ayuda"
            >
                <Icon path="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" className="w-8 h-8" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 right-6 w-full max-w-sm h-[70vh] max-h-[600px] bg-white rounded-xl shadow-2xl flex flex-col z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 bg-[#0F3460] text-white rounded-t-xl">
                            <h3 className="font-bold text-lg">Asistente Virtual</h3>
                            <button onClick={() => setIsOpen(false)} aria-label="Cerrar chat">
                                <Icon path="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                        <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start mb-4">
                                    <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-gray-200 text-gray-800 flex items-center">
                                        <Spinner className="w-5 h-5 text-gray-500" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t bg-white rounded-b-xl">
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Escribe tu pregunta..."
                                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3460]"
                                    disabled={isLoading}
                                />
                                <button onClick={handleSend} disabled={isLoading} className="ml-2 p-3 bg-[#0F3460] text-white rounded-lg disabled:bg-gray-400">
                                    <Icon path="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Chatbot;
