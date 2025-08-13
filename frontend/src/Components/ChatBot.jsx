import React, { useState, useEffect, useRef, useCallback } from 'react';

// Bot Avatar SVG as a React Component
const BotAvatarSVG = () => (
  <svg className="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024"
    style={{
      height: '35px',
      width: '35px',
      padding: '6px',
      backgroundColor: '#000b04',
      flexShrink: 0,
      fill: '#fff',
      borderRadius: '50%',
    }}
  >
    <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9z" />
  </svg>
);

// Helper function: formats numbered or bulleted text to HTML lists
const formatTextToHTMLPoints = (text) => {
  const lines = text.split('\n').filter(line => line.trim() !== '');

  const numbered = lines.every(line => /^\d+\.\s/.test(line.trim()));
  if (numbered) {
    const listItems = lines.map((line, index) => {
      const item = line.replace(/^\d+\.\s*/, '');
      return <li key={index}>{item}</li>;
    });
    return <ol>{listItems}</ol>;
  }

  const bulleted = lines.every(line => /^[-*•]\s/.test(line.trim()));
  if (bulleted) {
    const listItems = lines.map((line, index) => {
      const item = line.replace(/^[-*•]\s*/, '');
      return <li key={index}>{item}</li>;
    });
    return <ul>{listItems}</ul>;
  }

  return text.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < text.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));
};

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  // uploadedFile now holds { data: base64_with_prefix, mime_type: string, rawFile: File }
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const chatBodyRef = useRef(null);
  const messageInputRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Scroll to bottom of chat body whenever messages update
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Show welcome message on component mount
  useEffect(() => {
    setMessages([{
      type: 'bot',
      content: 'Welcome to Medi-Link! How can I assist you today?',
      isWelcome: true
    }]);
  }, []);

  // Handle outside clicks for emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Flask API URLs
  const FLASK_CHATBOT_URL = "http://127.0.0.1:5005/chatbot";
  const FLASK_PREDICT_IMAGE_URL = "http://127.0.0.1:5005/predict-image";

  // Function to add bot messages, useful for handleImageUpload
  const addBotMessage = useCallback((content) => {
    setMessages(prevMessages => {
      // Remove any existing 'thinking' message before adding new content
      const updatedMessages = prevMessages.filter(msg => !msg.isThinking);
      // Ensure content is formatted only if it's a string, otherwise pass directly (e.g., for thinking dots)
      const formattedContent = typeof content === 'string' ? formatTextToHTMLPoints(content) : content;
      return [...updatedMessages, { type: 'bot', content: formattedContent }];
    });
  }, []);

  const generateBotResponse = useCallback(async (userMessage, fileData) => {
    console.log("-> [generateBotResponse] Triggered. Message:", userMessage, "File data present:", !!fileData);

    // Add thinking indicator BEFORE sending the request
    setMessages(prevMessages => {
      // Remove any existing thinking indicator before adding a new one
      const withoutThinking = prevMessages.filter(msg => !msg.isThinking);
      return [...withoutThinking, {
        type: 'bot',
        content: (
          <div style={{ display: 'flex', gap: '4px', paddingBlock: '15px' }}>
            <div style={{ height: '7px', width: '7px', opacity: 0.8, borderRadius: '50%', backgroundColor: '#6bc29c' }}></div>
            <div style={{ height: '7px', width: '7px', opacity: 0.8, borderRadius: '50%', backgroundColor: '#6bc29c' }}></div>
            <div style={{ height: '7px', width: '7px', opacity: 0.8, borderRadius: '50%', backgroundColor: '#6bc29c' }}></div>
          </div>
        ),
        isThinking: true
      }];
    });

    let botResponseContent = "Sorry, I couldn't get a response from the server. Please try again later.";

    try {
      const flaskRequestBody = {
        message: userMessage,
      };

      // Only include image_data and mime_type if a file is present for the general chatbot API
      if (fileData && fileData.data && fileData.mime_type) {
        flaskRequestBody.image_data = fileData.data.split(",")[1]; // Flask expects image_data as a base64 string without prefix
        flaskRequestBody.mime_type = fileData.mime_type;
        console.log("-> [generateBotResponse] Including image base64 data in text chatbot request.");
      }

      const flaskRequestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flaskRequestBody),
      };

      console.log("-> [generateBotResponse] Attempting Flask API call to:", FLASK_CHATBOT_URL);
      // console.log("Request Body:", flaskRequestBody); // Uncomment for full body debug, be careful with large base64 strings

      const flaskResponse = await fetch(FLASK_CHATBOT_URL, flaskRequestOptions);
      console.log("-> [generateBotResponse] Flask API raw response status:", flaskResponse.status);

      if (!flaskResponse.ok) {
        const errorData = await flaskResponse.json().catch(() => ({ error: 'Could not parse error response.' }));
        console.error(`-> [generateBotResponse] Flask API returned error status ${flaskResponse.status}:`, errorData);
        throw new Error(`Flask API failed: ${errorData.error || errorData.response || 'No specific error message.'}`);
      }

      const flaskData = await flaskResponse.json();
      botResponseContent = flaskData.response;
      console.log("-> [generateBotResponse] Successful response from Flask API:", botResponseContent);

    } catch (error) {
      console.error("-> [generateBotResponse] Error communicating with Flask API:", error);
      botResponseContent = `Failed to get a response from the server. Error: ${error.message}. Please ensure the Flask API is running and accessible.`;
    } finally {
      // Ensure thinking indicator is removed in all cases (success or failure)
      addBotMessage(botResponseContent); // addBotMessage handles removing thinking and formatting
    }

  }, [FLASK_CHATBOT_URL, addBotMessage]);


  // New function to handle image upload for prediction
  const handleImagePredictionUpload = useCallback(async (fileToUpload) => {
    console.log("-> [handleImagePredictionUpload] Triggered with file:", fileToUpload);

    // Show thinking indicator BEFORE sending the request
    setMessages(prevMessages => {
      const withoutThinking = prevMessages.filter(msg => !msg.isThinking);
      return [...withoutThinking, {
        type: 'bot',
        content: (
          <div style={{ display: 'flex', gap: '4px', paddingBlock: '15px' }}>
            <div style={{ height: '7px', width: '7px', opacity: 0.8, borderRadius: '50%', backgroundColor: '#6bc29c' }}></div>
            <div style={{ height: '7px', width: '7px', opacity: 0.8, borderRadius: '50%', backgroundColor: '#6bc29c' }}></div>
            <div style={{ height: '7px', width: '7px', opacity: 0.8, borderRadius: '50%', backgroundColor: '#6bc29c' }}></div>
          </div>
        ),
        isThinking: true
      }];
    });

    const formData = new FormData();
    formData.append('image', fileToUpload); // Append the raw File object directly

    try {
      console.log("-> [handleImagePredictionUpload] Attempting fetch to:", FLASK_PREDICT_IMAGE_URL);
      // Directly check if formData has the image (for debugging purposes)
      for (let pair of formData.entries()) {
          console.log(`-> [handleImagePredictionUpload] FormData entry: ${pair[0]}, ${pair[1].name || pair[1]}`); // Log filename if it's a File object
      }


      const response = await fetch(FLASK_PREDICT_IMAGE_URL, {
        method: 'POST',
        body: formData, // FormData automatically sets Content-Type: multipart/form-data
      });

      console.log("-> [handleImagePredictionUpload] Flask Image API raw response status:", response.status);
      const data = await response.json().catch(() => ({ error: 'Could not parse response for image prediction.' }));

      if (response.ok) {
        const disease = data.prediction;
        console.log("-> [handleImagePredictionUpload] Prediction received:", disease);
        addBotMessage(`I detected **${disease}** from your image. Would you like to know more about its symptoms or treatments?`);
      } else {
        console.error("-> [handleImagePredictionUpload] Error response for image prediction:", data);
        addBotMessage(`Sorry, I could not process the image. ${data.error || 'Unknown error.'}`);
      }
    } catch (error) {
      console.error("-> [handleImagePredictionUpload] Error uploading image for prediction:", error);
      addBotMessage('There was an issue connecting to the image prediction service. Please try again.');
    } finally {
      // Ensure thinking indicator is removed in all cases (success or failure)
      setMessages(prevMessages => prevMessages.filter(msg => !msg.isThinking));
    }
  }, [FLASK_PREDICT_IMAGE_URL, addBotMessage]);


  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    const message = messageInput.trim();

    console.log("-> [handleSendMessage] Triggered. Message input:", `"${message}"`, "Uploaded file state:", uploadedFile);

    // Scenario 1: Only an image is uploaded (no text message)
    if (uploadedFile && !message) {
      console.log("-> [handleSendMessage] Scenario 1: Image ONLY detected. Calling handleImagePredictionUpload.");
      // Add the user's image message to the chat display
      setMessages(prevMessages => ([
        ...prevMessages,
        // The `file` property for display should include the full base64 data URL
        { type: 'user', content: '', file: uploadedFile }
      ]));
      await handleImagePredictionUpload(uploadedFile.rawFile); // Call the new image prediction handler with the raw File object

    // Scenario 2: Text message is present (with or without an image)
    } else if (message) { // This condition ensures we only process if there's actual text
      console.log("-> [handleSendMessage] Scenario 2: Text message detected (with/without image). Calling generateBotResponse.");
      // Add the user's text message (and optional image) to the chat display
      setMessages(prevMessages => {
        const newMessage = { type: 'user', content: message };
        if (uploadedFile) {
          newMessage.file = uploadedFile; // This is the full base64 data for display in chat
        }
        return [...prevMessages, newMessage];
      });
      // Send message and full base64 image data (if present) to the general chatbot API
      await generateBotResponse(message, uploadedFile); // Pass the full uploadedFile object

    } else {
      console.log("-> [handleSendMessage] Scenario 3: No message and no file. Doing nothing.");
      // Do nothing if both message and file are empty
      return;
    }

    // Clear input and file AFTER sending (important if awaiting calls)
    setMessageInput('');
    setUploadedFile(null);

  }, [messageInput, uploadedFile, generateBotResponse, handleImagePredictionUpload]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log("-> [handleFileUpload] No file selected.");
      return;
    }

    console.log("-> [handleFileUpload] Selected file object:", file); // Log the entire File object
    console.log("-> [handleFileUpload] File name:", file.name);
    console.log("-> [handleFileUpload] File type (MIME):", file.type); // CRITICAL: Check this in console!
    console.log("-> [handleFileUpload] File size:", file.size);

    // Read file as Data URL for display in chat preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const fullBase64DataURL = event.target.result; // This includes "data:image/png;base64," prefix
      console.log("-> [handleFileUpload] File read as full Base64 Data URL.");
      setUploadedFile({
        data: fullBase64DataURL, // Store the FULL Data URL for img src (e.g., 'data:image/png;base64,...')
        mime_type: file.type,      // Store original MIME type (e.g., 'image/png')
        rawFile: file              // Store the raw File object for FormData API
      });
    };
    reader.onerror = (error) => {
      console.error("-> [handleFileUpload] Error reading file:", error);
      setUploadedFile(null); // Clear file on error
    };
    reader.readAsDataURL(file);
  };

  const handleEmojiClick = (emoji) => {
    const currentInput = messageInputRef.current;
    if (currentInput) {
      const start = currentInput.selectionStart;
      const end = currentInput.selectionEnd;
      const value = currentInput.value;
      setMessageInput(value.substring(0, start) + emoji + value.substring(end));

      // Re-focus and set cursor position after inserting emoji
      setTimeout(() => {
        currentInput.focus();
        currentInput.selectionStart = currentInput.selectionEnd = start + emoji.length;
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  const emojiList = [
    '😀', '😁', '😂', '😃', '😄', '😅', '😆', '😇', '😊', '😋',
    '😎', '😍', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤔', '😐',
    '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪',
    '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔',
    '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤',
    '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱',
    '🥵', '🥶', '😳', '🤪', '😵', '😡', '😠', '🤬', '😷', '🤒',
    '🤕', '🤢', '🤮', '🤧', '🥳', '🥴', '🥺', '🤠', '🤡',
    '🤥', '🤫', '🤭', '🧐', '🤓', '😈', '👿', '👹', '👺', '💀',
    '👻', '👽', '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽'
  ];

  return (
    <>
      <div style={{
        boxSizing: 'border-box',
        fontFamily: '"Inter", sans-serif'
      }}>
        {!showChatbot && (
          <div id="minimized-chatbot" style={{
            position: 'fixed',
            bottom: '25px',
            right: '25px',
            zIndex: 1000,
          }}>
            <button id="open-chatbot" onClick={() => setShowChatbot(true)} style={{
              backgroundColor: '#159A7D',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '55px',
              height: '55px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" style={{ width: '40%', height: '40%' }}>
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
            </button>
          </div>
        )}

        {showChatbot && (
          <div className="chatbot-popup" style={{
            position: 'fixed',
            bottom: '25px',
            right: '25px',
            width: '420px',
            backgroundColor: '#fff',
            overflow: 'hidden',
            borderRadius: '15px',
            boxShadow: '0 32px 64px -48px rgba(0, 0, 0, 0.1), 0 0 128px 0 rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          }}>
            <div className="chat-header" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#159A7D',
              padding: '15px 22px',
              color: 'white',
            }}>
              <div className="header-info" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <BotAvatarSVG />
                <div className="logo-text" style={{
                  color: '#fff',
                  fontSize: '1.31rem',
                  fontWeight: 600,
                }}>ChatBot</div>
              </div>
              <button id="close-chatbot" onClick={() => setShowChatbot(false)} style={{
                border: 'none',
                color: '#fff',
                height: '40px',
                width: '40px',
                fontSize: '1.9rem',
                marginRight: '-10px',
                paddingTop: '2px',
                cursor: 'pointer',
                borderRadius: '50%',
                background: 'none',
                transition: 'background-color 0.2s ease',
              }}>×</button>
            </div>

            <div className="chat-body" ref={chatBodyRef} style={{
              padding: '25px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              height: '460px',
              marginBottom: '82px',
              overflowY: 'auto',
            }}>
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.type}-message`} style={{
                  display: 'flex',
                  gap: '11px',
                  alignItems: 'center',
                  flexDirection: msg.type === 'user' ? 'column' : 'row',
                  alignSelf: msg.type === 'user' ? 'flex-end' : 'auto',
                }}>
                  {msg.type === 'bot' && !msg.isThinking && (
                    <BotAvatarSVG style={{
                      height: '35px',
                      width: '35px',
                      padding: '6px',
                      background: '#50c4ad',
                      flexShrink: 0,
                      marginBottom: '2px',
                      alignSelf: 'flex-end',
                      borderRadius: '50%',
                      fill: '#fff',
                    }} />
                  )}
                  <div className="message-text" style={{
                    padding: '12px 16px',
                    maxWidth: '75%',
                    fontSize: '0.95rem',
                    background: msg.type === 'bot' ? '#F2F2FF' : '#159A7D',
                    borderRadius: msg.type === 'bot' ? '13px 13px 13px 3px' : '13px 13px 3px 13px',
                    color: msg.type === 'bot' ? '#000' : '#fff',
                  }}>
                    {/* Render content directly, assuming formatTextToHTMLPoints has already been applied if needed */}
                    {msg.isThinking ? msg.content : (
                      typeof msg.content === 'object' ? msg.content : (msg.isWelcome ? msg.content : formatTextToHTMLPoints(msg.content))
                    )}
                  </div>
                  {/* Display the image if available in the message */}
                  {msg.type === 'user' && msg.file && (
                    <img src={msg.file.data} alt="Uploaded" style={{ // Use msg.file.data directly for img src
                      maxWidth: '200px',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      marginTop: '8px',
                    }} />
                  )}
                </div>
              ))}
              {/* Display a preview of the currently uploaded file before sending */}
              {uploadedFile && (
                <div className="message user-message preview" style={{
                  display: 'flex',
                  gap: '11px',
                  alignItems: 'center',
                  flexDirection: 'column',
                  alignSelf: 'flex-end',
                }}>
                  <div className="message-text" style={{
                    padding: '12px 16px',
                    maxWidth: '75%',
                    fontSize: '0.95rem',
                    background: '#159A7D',
                    borderRadius: '13px 13px 3px 13px',
                    color: '#fff',
                  }}>
                    Image Preview:
                    <img src={uploadedFile.data} alt="Preview" style={{ // Use uploadedFile.data directly
                      maxWidth: '200px',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      marginTop: '8px',
                    }} />
                  </div>
                </div>
              )}
            </div>

            <div className="chat-footer" style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              background: '#fff',
              padding: '15px 22px 20px',
              borderTop: '1px solid #CCCCE5',
            }}>
              <form className="chat-form" onSubmit={handleSendMessage} style={{
                display: 'flex',
                alignItems: 'center',
                background: '#fff',
                borderRadius: '32px',
                outline: '1px solid #CCCCE5',
                padding: '5px 10px',
              }}>
                <textarea
                  ref={messageInputRef}
                  placeholder="Type a message..."
                  className="message-input"
                  required={!(messageInput || uploadedFile)} // Only required if both are empty
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
                    padding: '14px 0 13px 18px',
                    borderRadius: 'inherit',
                  }}
                ></textarea>
                <div className="chat-controls" style={{
                  display: 'flex',
                  height: '47px',
                  alignItems: 'center',
                  alignSelf: 'flex-end',
                  paddingRight: '6px',
                }}>
                  <button type="button" id="emoji-button" title="Insert Emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)} ref={emojiButtonRef} style={{
                    height: '35px',
                    width: '35px',
                    border: 'none',
                    fontSize: '1.15rem',
                    cursor: 'pointer',
                    color: '#0b7a4d',
                    background: 'none',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s ease',
                  }}>😀</button>
                  <button type="button" id="file-upload" onClick={() => document.getElementById('file-input-hidden').click()} style={{
                    height: '35px',
                    width: '35px',
                    border: 'none',
                    fontSize: '1.15rem',
                    cursor: 'pointer',
                    color: '#0b7a4d',
                    background: 'none',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s ease',
                  }}>📎</button>
                  <button type="submit" id="send-message" style={{
                    color: '#fff',
                    background: '#50c494',
                    display: (messageInput || uploadedFile) ? 'block' : 'none', // Button appears if message or file
                    height: '35px',
                    width: '35px',
                    border: 'none',
                    fontSize: '1.15rem',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s ease',
                  }}>➤</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Emoji Picker popup container */}
        {showEmojiPicker && (
          <div
            id="emoji-picker"
            ref={emojiPickerRef}
            style={{
              position: 'absolute', // Changed to absolute for precise positioning relative to parent
              background: '#fff',
              border: '1px solid #ccc',
              padding: '10px',
              borderRadius: '6px',
              maxWidth: '200px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              zIndex: 1001,
              // Calculate position dynamically
              top: emojiButtonRef.current ? `${emojiButtonRef.current.getBoundingClientRect().top - (emojiPickerRef.current?.offsetHeight || 0) - 10}px` : 'auto',
              left: emojiButtonRef.current ? `${emojiButtonRef.current.getBoundingClientRect().left}px` : 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(30px, 1fr))',
              gap: '5px',
              justifyItems: 'center',
            }}
          >
            {emojiList.map((emoji, index) => (
              <span key={index} className="emoji" onClick={() => handleEmojiClick(emoji)} style={{
                cursor: 'pointer',
                padding: '5px',
                fontSize: '1.2rem',
                lineHeight: '1.2',
                display: 'inline-block',
                transition: 'background-color 0.2s ease',
              }}>
                {emoji}
              </span>
            ))}
          </div>
        )}

        {/* Hidden file input */}
        <input type="file" id="file-input-hidden" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
      </div>
    </>
  );
}

export default Chatbot;