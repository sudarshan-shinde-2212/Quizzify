"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserGuard } from "../../../components/guards";
import { apiGetQuizAttemptReview } from "../../../components/api";
import { QuizAttempt } from "../../../components/api";
import { motion } from "motion/react";
import { ChevronLeft, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export default function QuizReviewPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const data = await apiGetQuizAttemptReview(quizId);
        setAttempt(data);
      } catch (err: any) {
        setError(err.message || "Failed to load quiz review");
      } finally {
        setLoading(false);
      }
    };
    fetchAttempt();
  }, [quizId]);

  if (loading) {
    return (
      <UserGuard>
        <div className="min-h-screen bg-white px-4 py-8 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-500">Loading review...</p>
        </div>
      </UserGuard>
    );
  }

  if (error) {
    return (
      <UserGuard>
        <div className="min-h-screen bg-white px-4 py-8 flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-black mb-2">Error</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => router.push("/history")}
            className="px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Back to History
          </button>
        </div>
      </UserGuard>
    );
  }

  if (!attempt?.quiz?.allowReviewAfterSubmission) {
    return (
      <UserGuard>
        <div className="min-h-screen bg-white px-4 py-8 flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
          <h2 className="text-xl font-semibold text-black mb-2">Review Disabled</h2>
          <p className="text-sm text-gray-500 text-center max-w-md">
            This quiz review has been disabled by the administrator.
          </p>
          <button
            onClick={() => router.push("/history")}
            className="mt-6 px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Back to History
          </button>
        </div>
      </UserGuard>
    );
  }

  return (
    <UserGuard>
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push("/history")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-black">Quiz Review</h1>
              <p className="text-sm text-gray-500">{attempt.quiz?.title}</p>
            </div>
          </div>

          <div className="space-y-6">
            {attempt.answers?.map((answer, index) => {
              const question = answer.question;
              const isCorrect = answer.selectedOption === question?.correctOption;
              return (
                <motion.div
                  key={answer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-100"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold border border-gray-200 text-black">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-black mb-2">
                        {question?.text}
                      </h3>
                      {question?.imageUrl && (
                        <div className="mb-4">
                          <img
                            src={question.imageUrl}
                            alt="Question image"
                            className="max-h-64 rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(["A", "B", "C", "D"] as const).map((option) => {
                      const isSelected = answer.selectedOption === option;
                      const isCorrectAnswer = question?.correctOption === option;
                      let bgClass = "border-gray-200 bg-white text-black";
                      let icon = null;

                      if (isCorrectAnswer) {
                        bgClass = "border-green-300 bg-green-50 text-green-900";
                        icon = <CheckCircle2 className="w-5 h-5 text-green-600" />;
                      } else if (isSelected && !isCorrect) {
                        bgClass = "border-red-300 bg-red-50 text-red-900";
                        icon = <XCircle className="w-5 h-5 text-red-600" />;
                      }

                      const optionText =
                        option === "A"
                          ? question?.optionA
                          : option === "B"
                          ? question?.optionB
                          : option === "C"
                          ? question?.optionC
                          : question?.optionD;

                      return (
                        <div
                          key={option}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bgClass}`}
                        >
                          <span className="text-sm font-semibold">{option}.</span>
                          <span className="text-sm flex-1">{optionText}</span>
                          {icon}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </UserGuard>
  );
}
