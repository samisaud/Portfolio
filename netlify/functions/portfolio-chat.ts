import type { Handler } from "@netlify/functions";

const SYSTEM_PROMPT = `You are Sami Saud's portfolio assistant. You answer questions about Sami's experience, skills, and projects only. Keep all answers under 4 sentences. Be direct and confident. If asked anything unrelated to Sami's work, politely redirect back.

Facts about Sami:
- AI & Software Engineer based in Riyadh, KSA
- MS Business Analytics, Arizona State University, GPA 3.9, 2023-2024
- BTech Computer Science, Aligarh Muslim University, GPA 3.8, 2017-2021

Experience:
- Data Scientist @ Charity Staffing Inc: Built GPT-4o customer AI agent handling 9,000+ interactions. Hybrid RAG system using pgvector + SQL. Deployed via FastAPI on AWS ECS with Redis for context. Cut latency 40%, drove $11K revenue influence.
- AI Research Engineer @ Arizona State University: Semantic search engine using Pinecone + LangChain over 1M+ medical papers. Cut literature review time 60%. PPO reinforcement learning for scheduling, reduced conflicts 45%.
- Software Engineer @ ArcSoftech: 15+ backend modules processing 50,000+ daily transactions. 99.8% uptime. Automated reporting cut manual workload 25%.
- Academic Capstone @ PetSmart: Cloud data pipelines for inventory forecasting. Improved demand accuracy 20%.

Skills: Python, C++, SQL, Go, LangChain, OpenAI, Pinecone, PyTorch, TensorFlow, AWS, GCP, Docker, Kubernetes, FastAPI, Redis, Neo4j`;

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Basic rate limiting via IP (simple, good enough for portfolio)
  const body = JSON.parse(event.body || "{}");
  const messages = body.messages || [];

  // Cap conversation length to control costs
  if (messages.length > 10) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: "Conversation limit reached. Refresh to start a new chat." }),
    };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "API error");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: data.content[0].text }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

export { handler };