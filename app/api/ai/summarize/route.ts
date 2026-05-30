import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { summarizeSchema } from "@/lib/validators";

type GroqSummary = {
  overallSentiment: "positive" | "neutral" | "needs_improvement";
  sentimentScore: number;
  averageRating: number;
  strengthsSummary: string;
  improvementsSummary: string;
  actionableAdvice: string[];
  standoutQuote: string;
};

function buildPrompt(studentName: string, feedback: Array<{ rating: number; strengths: string; improvements: string }>) {
  const feedbackData = feedback
    .map(
      (entry) =>
        `Rating: ${entry.rating}/5 | Strengths: ${entry.strengths} | Improvements: ${entry.improvements}`,
    )
    .join("\n");

  return `Analyze the following anonymous peer feedback for a student named ${studentName}.
There are ${feedback.length} reviews. Return a JSON object with exactly these fields:
{
  "overallSentiment": "positive" | "neutral" | "needs_improvement",
  "sentimentScore": float between -1.0 and 1.0,
  "averageRating": float,
  "strengthsSummary": "2-3 sentence paragraph summarizing what peers praised",
  "improvementsSummary": "2-3 sentence paragraph summarizing areas to improve",
  "actionableAdvice": ["specific advice 1", "specific advice 2", "specific advice 3"],
  "standoutQuote": "the single most insightful or representative comment from all feedback"
}

Feedback data:
${feedbackData}`;
}

function parseSummary(content: string): GroqSummary {
  const parsed = JSON.parse(content) as GroqSummary;
  if (
    !["positive", "neutral", "needs_improvement"].includes(parsed.overallSentiment) ||
    typeof parsed.sentimentScore !== "number" ||
    typeof parsed.averageRating !== "number" ||
    typeof parsed.strengthsSummary !== "string" ||
    typeof parsed.improvementsSummary !== "string" ||
    !Array.isArray(parsed.actionableAdvice) ||
    typeof parsed.standoutQuote !== "string"
  ) {
    throw new Error("Groq returned an invalid summary shape");
  }
  return {
    ...parsed,
    sentimentScore: Math.max(-1, Math.min(1, parsed.sentimentScore)),
    actionableAdvice: parsed.actionableAdvice.slice(0, 3).map(String),
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = summarizeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const form = await prisma.feedbackForm.findUnique({
    where: { id: parsed.data.formId },
    include: { group: { include: { members: true } } },
  });
  if (!form) return NextResponse.json({ message: "Form not found" }, { status: 404 });

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.targetUserId },
    select: { id: true, name: true },
  });
  if (!target) return NextResponse.json({ message: "Student not found" }, { status: 404 });
  if (!form.group.members.some((member) => member.userId === target.id)) {
    return NextResponse.json({ message: "Student is not in this form's group" }, { status: 400 });
  }

  const submissions = await prisma.feedbackSubmission.findMany({
    where: { formId: form.id, targetUserId: target.id },
    select: { rating: true, strengths: true, improvements: true },
  });
  if (submissions.length === 0) {
    return NextResponse.json({ message: "No feedback exists for this student yet" }, { status: 400 });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an academic feedback analyst. You receive anonymous peer feedback about a student and return a structured, constructive, professional summary. Always respond in valid JSON only. No preamble, no markdown.",
        },
        { role: "user", content: buildPrompt(target.name, submissions) },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Groq returned an empty response");

    const summary = parseSummary(content);
    const saved = await prisma.aISummary.upsert({
      where: { formId_targetUserId: { formId: form.id, targetUserId: target.id } },
      update: {
        summaryText: JSON.stringify(summary),
        sentimentScore: summary.sentimentScore,
        status: "GENERATED",
        errorMessage: null,
        generatedAt: new Date(),
      },
      create: {
        formId: form.id,
        targetUserId: target.id,
        summaryText: JSON.stringify(summary),
        sentimentScore: summary.sentimentScore,
        status: "GENERATED",
      },
    });

    return NextResponse.json({ summary: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Summary generation failed";
    console.error("Groq summary generation failed:", message);
    const failed = await prisma.aISummary.upsert({
      where: { formId_targetUserId: { formId: form.id, targetUserId: target.id } },
      update: {
        summaryText: "{}",
        sentimentScore: 0,
        status: "FAILED",
        errorMessage: message,
        generatedAt: new Date(),
      },
      create: {
        formId: form.id,
        targetUserId: target.id,
        summaryText: "{}",
        sentimentScore: 0,
        status: "FAILED",
        errorMessage: message,
      },
    });

    return NextResponse.json(
      { message: `Summary generation failed — ${message}`, summary: failed },
      { status: 502 },
    );
  }
}
