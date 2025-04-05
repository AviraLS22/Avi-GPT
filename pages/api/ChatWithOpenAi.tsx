import { useState } from "react";
import OpenAI from "openai";

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side API calls
});

const ChatWithOpenAI = () => {
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return; // Prevent sending empty input

    const newMessage: { role: "user" | "assistant"; text: string } = { role: "user", text: userInput };
    setChatHistory((prev) => [...prev, newMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4", // Use GPT-4 model
        messages: [
          ...chatHistory.map((msg) => ({ role: msg.role, content: msg.text })), // Pass chat history
          { role: "user", content: userInput }, // Current user input
        ],
        stream: true, // Enable streaming response
      });

      let assistantMessage = "";
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || "";
        assistantMessage += content;

        // Update response dynamically (stream effect)
        setChatHistory((prev) => {
          const updatedHistory = [...prev];
          if (updatedHistory.length && updatedHistory[updatedHistory.length - 1].role === "assistant") {
            updatedHistory[updatedHistory.length - 1].text += content;
          } else {
            updatedHistory.push({ role: "assistant", text: content });
          }
          return [...updatedHistory];
        });
      }
    } catch (error) {
      console.error("❌ OpenAI API Error:", error);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error: Unable to communicate with OpenAI." },
      ]);
    } finally {
      setIsLoading(false);
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
        {isLoading ? "Thinking..." : "Send"}
      </button>
    </div>
  );
};

export default ChatWithOpenAI;
