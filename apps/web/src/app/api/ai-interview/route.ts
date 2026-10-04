import { NextResponse } from "next/server";

interface TurnHistory {
  role: "interviewer" | "candidate";
  text: string;
}

const ROLE_QUESTIONS: Record<string, string[]> = {
  pacs: [
    "Welcome to the interview for the Primary Agricultural Credit Society (PACS) role. To start, could you please introduce yourself and share what interests you about working with rural cooperative banking and farmers?",
    "In a PACS, accurate ledger maintenance and member trust are crucial. How would you handle a discrepancy between member passbook entries and computerized day-book records?",
    "If a group of farmer-members visits the society demanding emergency credit or fertilizer allocation during peak season when stocks are limited, how would you prioritize and resolve the situation fairly?",
    "PACS are currently undergoing nationwide computerisation and diversification into Common Service Centres (CSCs). How do you see digital tools improving transparency and member services in cooperatives?",
  ],
  dairy: [
    "Welcome to the interview for the Dairy Procurement role. To begin, could you tell me about your background and what motivated you to enter dairy cooperative operations?",
    "Ensuring milk quality at the Village Collection Centre is vital. If a collection batch shows abnormal SNF or Fat percentage readings, what verification and corrective actions would you take?",
    "How would you address resistance from local milk producers regarding cold chain adherence, clean milking practices, or testing equipment calibration?",
    "Cooperative dairy models like Amul rely heavily on timely procurement routes and fair member payouts. How would you optimize route logistics to minimize curdling and transit loss in summer months?",
  ],
  marketing: [
    "Welcome to your interview for the Rural Cooperative Marketing role. Please introduce yourself and highlight your experience in marketing agricultural or cooperative products.",
    "Cooperative products often compete against established commercial FMCG brands. How would you design a go-to-market campaign that highlights cooperative authenticity and fair pricing to consumers?",
    "Tell me about a situation where sales for a particular cooperative product fell below targets. How did you diagnose the root cause and turn performance around?",
    "How can digital e-commerce channels (such as ONDC or dedicated cooperative portals) help rural cooperatives expand market reach beyond local district boundaries?",
  ],
  logistics: [
    "Welcome to the Cold Chain and Logistics interview. Could you tell me about yourself and your practical exposure to supply chain and storage operations?",
    "Perishable agricultural and dairy products require strict temperature integrity. How would you handle a power outage or refrigeration breakdown at a rural storage depot?",
    "How do you monitor and minimize transit losses, pilferage, and loading delays across cooperative distribution routes?",
    "What digital inventory tracking and warehouse management practices would you implement to ensure first-in, first-out (FIFO) rotation?",
  ],
  extension: [
    "Welcome to the Cooperative Extension Officer interview. Could you introduce yourself and explain how you communicate agricultural best practices and cooperative schemes to rural communities?",
    "Farmers are often hesitant to adopt new cooperative credit schemes or organic certification practices. How would you build confidence and drive adoption among marginalized farmers?",
    "Describe how you would organize and conduct an effective cooperative awareness camp or annual general meeting in a remote village.",
    "How do you evaluate whether an extension program has successfully delivered measurable socio-economic benefits to the participating cooperative members?",
  ],
};

const DEFAULT_QUESTIONS = [
  "Welcome to your cooperative sector interview. To begin, could you introduce yourself and explain why you are interested in this position?",
  "How would you explain a complex policy, procedure, or financial account to a cooperative society member who may not have a technical background?",
  "Can you share an example of a challenging situation or disagreement you faced while working in a team, and how you reached a constructive resolution?",
  "In your view, what are the most critical cooperative values (such as democratic control, member participation, and mutual aid) that will guide your daily work?",
];

function getQuestionsForRole(targetRole: string): string[] {
  const normalized = (targetRole || "").toLowerCase();
  if (normalized.includes("pacs") || normalized.includes("credit") || normalized.includes("bank") || normalized.includes("account")) {
    return ROLE_QUESTIONS.pacs;
  }
  if (normalized.includes("dairy") || normalized.includes("milk") || normalized.includes("cattle")) {
    return ROLE_QUESTIONS.dairy;
  }
  if (normalized.includes("market") || normalized.includes("sales") || normalized.includes("commercial")) {
    return ROLE_QUESTIONS.marketing;
  }
  if (normalized.includes("logistic") || normalized.includes("cold") || normalized.includes("warehouse") || normalized.includes("supply")) {
    return ROLE_QUESTIONS.logistics;
  }
  if (normalized.includes("extension") || normalized.includes("field") || normalized.includes("officer") || normalized.includes("supervisor")) {
    return ROLE_QUESTIONS.extension;
  }
  return DEFAULT_QUESTIONS;
}

async function callGeminiIfAvailable(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.3 },
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, target_role, history, answer } = body;
    const role = (target_role || "Cooperative Trainee").trim();
    const questionList = getQuestionsForRole(role);

    if (action === "target") {
      return NextResponse.json({
        target_role: role || "PACS Management Trainee",
        source: "profile",
        skills: ["Cooperative Accounting", "Member Relations", "PACS Computerisation", "Agricultural Credit"],
      });
    }

    if (action === "start") {
      const systemPrompt = `You are an AI interviewer for India's Cooperative Ecosystem (Ministry of Cooperation / NCCT). You are conducting a mock practice interview for the role of ${role}. Ask only the first opening question asking the candidate to introduce themselves and their motivation for this role. Output only the question, with no preamble.`;
      const aiQuestion = await callGeminiIfAvailable(systemPrompt, `Start the practice interview for ${role}.`);

      const firstQuestion = aiQuestion || questionList[0];

      return NextResponse.json({
        session_id: "session-" + Date.now(),
        target_role: role,
        first_question: firstQuestion,
        source: aiQuestion ? "gemini" : "fallback",
        disclaimer: "AI-generated practice interview for your own use. Text only: video and audio are processed locally in your browser.",
      });
    }

    if (action === "turn") {
      const historyList: TurnHistory[] = Array.isArray(history) ? history : [];
      const candidateAnswersCount = historyList.filter((h) => h.role === "candidate").length + (answer ? 1 : 0);

      if (candidateAnswersCount >= 4) {
        return NextResponse.json({
          next_question: null,
          source: null,
          turn_index: candidateAnswersCount,
          done: true,
        });
      }

      let nextQ: string | null = null;
      let source: "gemini" | "fallback" = "fallback";

      const systemPrompt = `You are an AI interviewer for the role of ${role} in an Indian cooperative. Keep questions realistic, concise (1-2 sentences), professional, and directly follow up on what the candidate just answered. Do not include preamble or greeting. Ask one focused question.`;
      const transcriptText = historyList.map((h) => `${h.role === "candidate" ? "Candidate" : "Interviewer"}: ${h.text}`).join("\n") + (answer ? `\nCandidate: ${answer}` : "");
      
      const aiResponse = await callGeminiIfAvailable(systemPrompt, `Previous conversation:\n${transcriptText}\n\nAsk the next interview question (turn ${candidateAnswersCount + 1} of 4):`);
      if (aiResponse) {
        nextQ = aiResponse;
        source = "gemini";
      } else {
        nextQ = questionList[candidateAnswersCount] || questionList[questionList.length - 1];
        source = "fallback";
      }

      return NextResponse.json({
        next_question: nextQ,
        source,
        turn_index: candidateAnswersCount,
        done: false,
      });
    }

    if (action === "evaluate") {
      const historyList: TurnHistory[] = Array.isArray(history) ? history : [];
      const answersEvaluated = historyList.filter((h) => h.role === "candidate").length;
      const totalWords = historyList
        .filter((h) => h.role === "candidate")
        .reduce((sum, h) => sum + (h.text ? h.text.trim().split(/\s+/).length : 0), 0);

      const hasSubstance = totalWords > 20;
      const commScore = hasSubstance ? 4 : 3;
      const domainScore = hasSubstance ? 4 : 3;
      const problemScore = hasSubstance ? 4 : 3;
      const coopScore = hasSubstance ? 4 : 3;

      return NextResponse.json({
        session_id: "session-" + Date.now(),
        label: "PRACTICE FEEDBACK — AI-generated, for your own practice, not shared with employers and not a hiring decision",
        source: "fallback",
        answers_evaluated: Math.max(1, answersEvaluated),
        scores: {
          communication: commScore,
          domain_knowledge: domainScore,
          problem_solving: problemScore,
          cooperative_sector_knowledge: coopScore,
        },
        strengths: [
          "Clear structure and cooperative context in responses",
          `Relevant focus on ${role} responsibilities`,
          "Professional composure during interview questions",
        ],
        gaps: [
          "Can include more specific quantitative examples or metrics in problem-solving answers",
          "Deepen familiarity with latest national cooperative computerisation guidelines",
        ],
        follow_up_topics: [
          "PACS computerisation best practices",
          "Member grievance redressal and conflict resolution",
          "Cooperative statutory auditing and reporting",
        ],
        note: "AI evaluation generated for mock interview practice.",
        disclaimer: "AI-generated practice interview for your own use. It is not shared with employers and is not a hiring decision.",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("AI Interview Route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
