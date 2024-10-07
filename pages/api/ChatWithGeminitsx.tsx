import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const ChatWithGemini = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return; // Prevent sending empty input

    setChatHistory((prev) => [...prev, { role: "user", text: userInput }]);

    try {
      setIsLoading(true);

      // Start a new chat if there's no chat history or if it's the first interaction
      const chat = await model.startChat({
        history: chatHistory.length > 0
          ? chatHistory.map((msg) => ({
              role: msg.role,
              parts: [{ text: msg.text }],
            }))
          : [{ role: "user", parts: [{ text: userInput }] }],
      });

      // Send the user message
      const result = await chat.sendMessage(userInput);

      // Display the AI response
      setChatHistory((prev) => [
        ...prev,
        { role: "model", text: result.response.text() },
      ]);
    } catch (error) {
      console.error("Error communicating with Google Gemini AI:", error);
      setChatHistory((prev) => [
        ...prev,
        { role: "model", text: `Error: ${error.message || "Unable to communicate with the AI."}` },
      ]);
    } finally {
      setIsLoading(false);
      setUserInput(""); // Clear the input field
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {chatHistory.map((msg, index) => (
          <p key={index} className={msg.role === "user" ? "user-message" : "ai-message"}>
            {msg.role === "user" ? "You: " : "AI: "} {msg.text}
          </p>
        ))}
      </div>
      <input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Type your message..."
        className="input-field"
      />
      <button onClick={handleSendMessage} disabled={isLoading} className="send-button">
        {isLoading ? "Sending..." : "Send"}
      </button>
    </div>
  );
};

export default ChatWithGemini;
