"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Message = {
  id: string;
  role: "bot" | "user";
  content: string;
  timestamp: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: "msg-1",
    role: "bot",
    content: "Hi Ravindra! I am CoopSetu AI, your career and learning assistant. How can I help you today?",
    timestamp: new Date().toISOString(),
  }
];

const SUGGESTIONS = [
  "What courses should I take next?",
  "How do I apply for PACS Digital Accounting?",
  "Show my skill passport summary",
];

const BOT_RESPONSES = [
  "Based on your profile, I recommend completing the 'PACS Digital Accounting' certification next. It perfectly aligns with your experience.",
  "You can navigate to the 'Programmes' tab from the sidebar to register for new courses.",
  "Your skill passport currently shows 'Advanced' in Dairy Operations and 'Intermediate' in PACS Accounting.",
  "Is there anything else I can assist you with regarding your cooperative career path?",
];

export function MockChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const newUserMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      const randomResponse = BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)];
      const newBotMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "bot",
        content: randomResponse,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newBotMsg]);
      setIsTyping(false);
    }, 1500);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-110 active:scale-95 group"
      >
        <MessageSquare className="size-6 group-hover:hidden" />
        <Sparkles className="size-6 hidden group-hover:block" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
          1
        </span>
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[350px] flex-col overflow-hidden shadow-2xl border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-primary/5 p-4 py-3 space-y-0">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="size-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">CoopSetu AI</CardTitle>
            <p className="text-[10px] text-green-600 font-medium flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-green-500" /> Online
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </CardHeader>
      
      <CardContent className="flex flex-1 flex-col p-0 overflow-hidden bg-muted/20">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex w-full gap-2",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "bot" && (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground mt-0.5">
                  <Bot className="size-3.5" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-card border border-border text-foreground rounded-tl-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex w-full gap-2 justify-start">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground mt-0.5">
                <Bot className="size-3.5" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1 items-center h-[38px]">
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {messages.length < 3 && !isTyping && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <Badge 
                key={suggestion} 
                variant="secondary" 
                className="text-[10px] cursor-pointer hover:bg-primary/20 py-1 font-normal border border-primary/10"
                onClick={() => handleSend(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        )}

        <div className="border-t bg-card p-3">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 rounded-full text-sm h-9"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isTyping}
              className="h-9 w-9 rounded-full shrink-0"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
