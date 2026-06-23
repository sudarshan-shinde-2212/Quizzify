import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { QuizAnswer } from '../entities/quiz-answer.entity';
import { QuizResult } from '../entities/quiz-result.entity';
import { Question } from '../entities/question.entity';
import { QuizzesService } from '../quizzes/quizzes.service';
import { SubmitAnswersDto } from './dto/submit-answers.dto';

import { SettingsService } from '../settings/settings.service';
import { StudentsService } from '../students/students.service';

@Injectable()
export class AttemptsService {
  private readonly logger = new Logger(AttemptsService.name);

  constructor(
    @InjectRepository(QuizAttempt) private attemptRepo: Repository<QuizAttempt>,
    @InjectRepository(QuizAnswer) private answerRepo: Repository<QuizAnswer>,
    @InjectRepository(QuizResult) private resultRepo: Repository<QuizResult>,
    @InjectRepository(Question) private questionRepo: Repository<Question>,
    private quizzesService: QuizzesService,
    private settingsService: SettingsService,
    private studentsService: StudentsService,
  ) {}

  async startQuiz(studentId: string, quizId: string): Promise<QuizAttempt> {
    // Get the quiz first to check allowRetakes and maxRetakes settings
    const quiz = await this.quizzesService.findOneActive(quizId);

    // Get all existing attempts for this student and quiz
    const existingAttempts = await this.attemptRepo.find({
      where: { studentId, quizId },
      order: { startedAt: 'ASC' },
    });

    // Check if there's an unsubmitted attempt - return it immediately
    const unsubmittedAttempt = existingAttempts.find(a => !a.isSubmitted);
    if (unsubmittedAttempt) {
      return unsubmittedAttempt;
    }

    // Calculate max allowed attempts
    const maxAttempts = 1 + quiz.maxRetakes;
    const attemptCount = existingAttempts.length;

    // Check if we've reached the limit
    if (attemptCount >= maxAttempts) {
      throw new ConflictException('Retake limit reached');
    }

    // Create new attempt
    const attempt = this.attemptRepo.create({
      studentId,
      quizId,
      startedAt: new Date(),
    });
    return this.attemptRepo.save(attempt);
  }

  async submitQuiz(studentId: string, quizId: string, dto: SubmitAnswersDto) {
    this.logger.log(`Quiz submission started – studentId: ${studentId}, quizId: ${quizId}`);

    const quiz = await this.quizzesService.findOneActive(quizId);

    const attempt = await this.attemptRepo.findOne({
      where: { studentId, quizId },
    });
    if (!attempt) throw new NotFoundException('Quiz not started');
    if (attempt.isSubmitted) throw new ConflictException('Quiz already submitted');

    // Timer validation
    const now = new Date();
    const deadline = new Date(
      attempt.startedAt.getTime() + (quiz.durationInMinutes * 60 + 120) * 1000,
    );
    if (now > deadline) {
      throw new BadRequestException('Quiz duration exceeded. Submission rejected.');
    }

    // Load questions
    const questions = await this.questionRepo.find({ where: { quizId } });
    if (!questions.length) throw new NotFoundException('No questions found for quiz');

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // REMOVED: Mandatory question validation - allow submission with unanswered questions

    // Save answers
    const answerEntities = dto.answers
      .filter((a) => questionMap.has(a.questionId))
      .map((a) =>
        this.answerRepo.create({
          attemptId: attempt.id,
          questionId: a.questionId,
          selectedOption: a.selectedOption,
        }),
      );
    await this.answerRepo.save(answerEntities);

    // Score calculation
    const totalQuestions = questions.length;
    const attemptedQuestions = answerEntities.length;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let score: number | null = 0;
    let percentage: number | null = 0;

    if (!dto.cheatingDetected) {
      const settings = await this.settingsService.getSettings();
      const quizNegMark = Number(quiz.negativeMarks ?? settings.negativeMarking ?? 0);

      for (const answer of answerEntities) {
        const question = questionMap.get(answer.questionId);
        if (!question) continue;

        if (answer.selectedOption === question.correctOption) {
          correctAnswers++;
          score += Number(question.marks);
        } else {
          wrongAnswers++;
          // Apply negative marking: per-question if set, else quiz-level (0 = disabled)
          const negMark = Number(question.negativeMarks ?? quizNegMark ?? 0);
          if (negMark > 0) {
            score -= negMark;
          }
        }
      }

      // Clamp to 0
      if (score < 0) score = 0;

      const maxScore = questions.reduce((sum, q) => sum + Number(q.marks), 0);
      percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    } else {
      // If cheating detected, set score and percentage to null
      score = null;
      percentage = null;
    }

    // Mark attempt as submitted
    attempt.isSubmitted = true;
    attempt.submittedAt = now;
    await this.attemptRepo.save(attempt);
    this.logger.log(`Attempt saved – score: ${score !== null ? score.toFixed(2) : 'NULL'}, percentage: ${percentage !== null ? percentage.toFixed(2) : 'NULL'}%`);

    // Save result
    const result = this.resultRepo.create({
      attemptId: attempt.id,
      studentId,
      quizId,
      totalQuestions,
      attemptedQuestions,
      correctAnswers,
      wrongAnswers,
      score: score !== null ? parseFloat(score.toFixed(2)) : null,
      percentage: percentage !== null ? parseFloat(percentage.toFixed(2)) : null,
      cheatingDetected: dto.cheatingDetected ?? false,
    });
    await this.resultRepo.save(result);

    return {
      score: result.score,
      percentage: result.percentage,
      correctAnswers: result.correctAnswers,
      wrongAnswers: result.wrongAnswers,
      totalQuestions: result.totalQuestions,
    };
  }
}
