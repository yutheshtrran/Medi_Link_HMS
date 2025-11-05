import React, { useState, useEffect, useRef, useCallback } from 'react';

// 🤖 Bot Avatar SVG
const BotAvatarSVG = () => (
  <svg 
    className="bot-avatar" 
    xmlns="http://www.w3.org/2000/svg" 
    width="50" 
    height="50" 
    viewBox="0 0 24 24"
    style={{
      height: '35px',
      width: '35px',
      padding: '5px',
      backgroundColor: '#008080',
      flexShrink: 0,
      fill: '#fff',
      borderRadius: '50%',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', 
    }}
  >
    <path d="M12 1.5a10.5 10.5 0 100 21 10.5 10.5 0 000-21zm-4.5 13.5v-3h9v3h-9zm-1.5-6h12a.75.75 0 010 1.5H6a.75.75 0 010-1.5z" />
    <circle cx="8.5" cy="10" r="1.5"/>
    <circle cx="15.5" cy="10" r="1.5"/>
  </svg>
);

// 🧑 User Avatar SVG
const UserAvatarSVG = () => (
  <svg 
    className="user-avatar" 
    xmlns="http://www.w3.org/2000/svg" 
    width="50" 
    height="50" 
    viewBox="0 0 24 24"
    style={{
      height: '35px',
      width: '35px',
      padding: '5px',
      backgroundColor: '#005050',
      flexShrink: 0,
      fill: '#fff',
      borderRadius: '50%',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', 
    }}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.83 6-3.83 2 0 5.97 1.84 6 3.83-1.29 1.94-3.5 3.22-6 3.22z"/>
  </svg>
);

// 🔹 Helper: parse **bold** Markdown to <strong>
const parseBoldMarkdown = (text) => {
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

// 🔹 Helper: format text into lists or lines with Markdown bold
const formatTextToHTMLPoints = (text) => {
  const lines = text.split('\n').filter(line => line.trim() !== '');

  const numbered = lines.every(line => /^\d+\.\s/.test(line.trim()));
  if (numbered) {
    const listItems = lines.map((line, index) => {
      const item = line.replace(/^\d+\.\s*/, '');
      return <li key={index}>{parseBoldMarkdown(item)}</li>;
    });
    return <ol>{listItems}</ol>;
  }

  const bulleted = lines.every(line => /^[-*•]\s/.test(line.trim()));
  if (bulleted) {
    const listItems = lines.map((line, index) => {
      const item = line.replace(/^[-*•]\s*/, '');
      return <li key={index}>{parseBoldMarkdown(item)}</li>;
    });
    return <ul>{listItems}</ul>;
  }

  return text.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {parseBoldMarkdown(line)}
      {index < text.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));
};

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);

  const chatBodyRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setMessages([{
      type: 'bot',
      content: 'Welcome to Medi-Link! How can I assist you today?',
      isWelcome: true
    }]);
  }, []);

  const FLASK_CHATBOT_URL = "http://127.0.0.1:5005/chatbot";
  const FLASK_PREDICT_IMAGE_URL = "http://127.0.0.1:5005/predict-image";

  const addBotMessage = useCallback((content) => {
    setMessages(prevMessages => {
      const updatedMessages = prevMessages.filter(msg => !msg.isThinking);
      const formattedContent = typeof content === 'string' ? formatTextToHTMLPoints(content) : content;
      return [...updatedMessages, { type: 'bot', content: formattedContent }];
    });
  }, []);

  const generateBotResponse = useCallback(async (userMessage, fileData) => {
    setMessages(prevMessages => {
      const withoutThinking = prevMessages.filter(msg => !msg.isThinking);
      return [...withoutThinking, {
        type: 'bot',
        content: (
          <div style={{ display: 'flex', gap: '4px', paddingBlock: '15px' }}>
            <div className="bot-thinking-dot"></div>
            <div className="bot-thinking-dot"></div>
            <div className="bot-thinking-dot"></div>
          </div>
        ),
        isThinking: true
      }];
    });

    let botResponseContent = "Sorry, I couldn't get a response from the server. Please try again later.";

    try {
      const flaskRequestBody = { message: userMessage };

      if (fileData && fileData.data && fileData.mime_type) {
        flaskRequestBody.image_data = fileData.data.split(",")[1];
        flaskRequestBody.mime_type = fileData.mime_type;
      }

      const flaskResponse = await fetch(FLASK_CHATBOT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flaskRequestBody),
      });

      if (!flaskResponse.ok) throw new Error('Flask API error');

      const flaskData = await flaskResponse.json();
      botResponseContent = flaskData.response;
    } catch (error) {
      botResponseContent = `Failed to get a response from the server. Error: ${error.message}`;
    } finally {
      addBotMessage(botResponseContent);
    }
  }, [FLASK_CHATBOT_URL, addBotMessage]);

  const handleImagePredictionUpload = useCallback(async (fileToUpload) => {
    setMessages(prevMessages => {
      const withoutThinking = prevMessages.filter(msg => !msg.isThinking);
      return [...withoutThinking, {
        type: 'bot',
        content: (
          <div style={{ display: 'flex', gap: '4px', paddingBlock: '15px' }}>
            <div className="bot-thinking-dot"></div>
            <div className="bot-thinking-dot"></div>
            <div className="bot-thinking-dot"></div>
          </div>
        ),
        isThinking: true
      }];
    });

    const formData = new FormData();
    formData.append('image', fileToUpload);

    try {
      const response = await fetch(FLASK_PREDICT_IMAGE_URL, { method: 'POST', body: formData });
      const data = await response.json();
      if (response.ok) {
        const disease = data.prediction;
        addBotMessage(`I detected **${disease}** from your image. Would you like to know more about its symptoms or treatments?`);
      } else {
        addBotMessage(`Sorry, I could not process the image. ${data.error || 'Unknown error.'}`);
      }
    } catch (error) {
      addBotMessage('There was an issue connecting to the image prediction service. Please try again.');
    } finally {
      setMessages(prevMessages => prevMessages.filter(msg => !msg.isThinking));
    }
  }, [FLASK_PREDICT_IMAGE_URL, addBotMessage]);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    const message = messageInput.trim();

    if (!message && !uploadedFile) return;

    setMessages(prev => [
      ...prev,
      { type: 'user', content: message, file: uploadedFile || null }
    ]);

    setMessageInput('');
    setUploadedFile(null);

    if (uploadedFile && !message) {
      await handleImagePredictionUpload(uploadedFile.rawFile);
      return;
    }

    await generateBotResponse(message, uploadedFile);
  }, [messageInput, uploadedFile, generateBotResponse, handleImagePredictionUpload]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedFile({
        data: event.target.result,
        mime_type: file.type,
        rawFile: file
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* 🔹 Bouncing Dot Animation + Pulse Glow CSS */}
      <style>{`
        .bot-thinking-dot {
          height: 7px;
          width: 7px;
          border-radius: 50%;
          background-color: #008080;
          opacity: 0.8;
          animation: bounce 1.4s infinite ease-in-out;
        }
        .bot-thinking-dot:nth-child(1) { animation-delay: 0s; }
        .bot-thinking-dot:nth-child(2) { animation-delay: 0.2s; }
        .bot-thinking-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }

        /* 🌟 Teal Glow Pulse Animation */
        @keyframes pulse-teal {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 128, 128, 0.6),
                        0 0 15px rgba(0, 128, 128, 0.8);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(0, 128, 128, 0.1),
                        0 0 25px rgba(0, 128, 128, 0.6);
            transform: scale(1.05);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 128, 128, 0),
                        0 0 10px rgba(0, 128, 128, 0.5);
            transform: scale(1);
          }
        }
      `}</style>

      <div style={{ boxSizing: 'border-box', fontFamily: '"Inter", sans-serif' }}>
        {!showChatbot && (
          <div id="minimized-chatbot" style={{ position: 'fixed', bottom: '25px', right: '25px', zIndex: 1000 }}>
            <button 
              id="open-chatbot" 
              onClick={() => setShowChatbot(true)} 
              style={{
                backgroundColor: '#008080',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '65px',
                height: '65px',
                boxShadow: '0 0 20px rgba(0, 128, 128, 0.5), 0 6px 12px rgba(0,0,0,0.25)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem',
                transition: 'all 0.3s ease-in-out',
                animation: 'pulse-teal 2s infinite'
              }}
            >
              🧠
            </button> 
          </div>
        )}

        {/* Chatbot Popup */}
        {showChatbot && (
          <div className="chatbot-popup" style={{
            position: 'fixed', bottom: '25px', right: '25px', width: '420px',
            backgroundColor: '#fff', borderRadius: '20px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 0 25px rgba(0,128,128,0.3)',
            overflow: 'hidden',
            zIndex: 1000,
          }}>
            {/* Header */}
            <div className="chat-header" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: '#008080',
              padding: '15px 22px', color: 'white',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <BotAvatarSVG />
                <div style={{ fontSize: '1.31rem', fontWeight: 600 }}>Medi-Link Bot</div>
              </div>
              <button onClick={() => setShowChatbot(false)} style={{
                border: 'none', color: '#fff', fontSize: '1.9rem', background: 'none', cursor: 'pointer'
              }}>×</button>
            </div>

            {/* Body */}
            <div className="chat-body" ref={chatBodyRef} style={{
              padding: '25px 22px', display: 'flex', flexDirection: 'column', gap: '20px',
              height: '460px', marginBottom: '82px', overflowY: 'auto',
            }}>
              {messages.map((msg, index) => (
                <div key={index} style={{
                  display: 'flex',
                  flexDirection: msg.type === 'user' ? 'row-reverse' : 'row', 
                  alignItems: 'center',
                  alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                  gap: '11px'
                }}>
                  {msg.type === 'bot' && !msg.isThinking && <BotAvatarSVG />}
                  {msg.type === 'user' && <UserAvatarSVG />}
                  
                  <div style={{
                    padding: '12px 16px', maxWidth: '75%',
                    fontSize: '0.95rem',
                    background: msg.type === 'bot' ? '#A7DBD8' : '#005050',
                    borderRadius: msg.type === 'bot' ? '16px 16px 16px 6px' : '16px 16px 6px 16px',
                    color: msg.type === 'bot' ? '#000' : '#fff',
                    marginLeft: msg.type === 'bot' ? '0' : '11px', 
                    marginRight: msg.type === 'user' ? '0' : '11px',
                  }}>
                    {msg.isThinking ? msg.content : (
                      typeof msg.content === 'object' ? msg.content :
                        (msg.isWelcome ? msg.content : formatTextToHTMLPoints(msg.content))
                    )}
                  </div>

                  {msg.type === 'user' && msg.file && (
                    <img 
                        src={msg.file.data} 
                        alt="Uploaded" 
                        style={{
                            maxWidth: '200px', 
                            maxHeight: '200px', 
                            borderRadius: '8px', 
                            marginRight: '11px' 
                        }} 
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="chat-footer" style={{
              position: 'absolute', bottom: 0, width: '100%', background: '#fff',
              padding: '15px 22px 20px', borderTop: '1px solid #CCCCE5',
            }}>
              <form onSubmit={handleSendMessage} style={{
                display: 'flex', alignItems: 'center', background: '#fff',
                borderRadius: '32px', outline: '1px solid #CCCCE5', padding: '5px 10px',
              }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {uploadedFile && (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={uploadedFile.data}
                        alt="Preview"
                        style={{ maxWidth: '120px', maxHeight: '120px', borderRadius: '8px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setUploadedFile(null)}
                        style={{
                          position: 'absolute',
                          top: '-5px',
                          right: '-5px',
                          background: '#ff4d4f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          lineHeight: '20px',
                          textAlign: 'center'
                        }}
                      >×</button>
                    </div>
                  )}
                  <textarea
                    ref={messageInputRef}
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    style={{
                      border: 'none',
                      outline: 'none',
                      height: '47px',
                      width: '100%',
                      resize: 'none',
                      fontSize: '0.95rem',
                      padding: '14px 0 13px 18px'
                    }}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button type="button" onClick={() => document.getElementById('file-input-hidden').click()} style={{
                    height: '35px', width: '35px', border: 'none', background: 'none',
                    fontSize: '1.15rem', cursor: 'pointer'
                  }}>📎</button>

                  <button
                    type="submit"
                    disabled={!messageInput.trim() && !uploadedFile}
                    style={{
                      color: '#fff',
                      background: (!messageInput.trim() && !uploadedFile) ? '#80a0a0' : '#008080',
                      height: '35px',
                      width: '35px',
                      border: 'none',
                      fontSize: '1.15rem',
                      cursor: (!messageInput.trim() && !uploadedFile) ? 'not-allowed' : 'pointer',
                      borderRadius: '50%',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    ➤
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <input type="file" id="file-input-hidden" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
      </div>
    </>
  );
}

export default Chatbot;
