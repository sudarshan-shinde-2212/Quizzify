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
import { EmailService } from '../email/email.service';
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
    private emailService: EmailService,
    private studentsService: StudentsService,
  ) {}

  async startQuiz(studentId: string, quizId: string): Promise<QuizAttempt> {
    await this.quizzesService.findOneActive(quizId);

    const existing = await this.attemptRepo.findOne({
      where: { studentId, quizId },
    });

    if (existing) {
      if (existing.isSubmitted) {
        // Check if retakes are allowed before permitting a new attempt
        const settings = await this.settingsService.getSettings();
        const allowRetakes = settings?.allowRetakes ?? false;
        if (!allowRetakes) {
          throw new ConflictException('Quiz already attempted. Retakes are not allowed.');
        }
      }
      // Remove old attempt to allow a fresh start
      await this.attemptRepo.remove(existing);
    }

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
    let score = 0;

    const settings = await this.settingsService.getSettings();
    this.logger.log(`Settings loaded – emailNotifications: ${settings?.emailNotifications}, negativeMarking: ${settings?.negativeMarking}`);

    const useNegativeMarking = settings?.negativeMarking ?? false;

    for (const answer of answerEntities) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue;

      if (answer.selectedOption === question.correctOption) {
        correctAnswers++;
        score += Number(question.marks);
      } else {
        wrongAnswers++;
        if (useNegativeMarking) {
          score -= Number(question.negativeMarks);
        }
      }
    }

    // Clamp to 0
    if (score < 0) score = 0;

    const maxScore = questions.reduce((sum, q) => sum + Number(q.marks), 0);
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    // Mark attempt as submitted
    attempt.isSubmitted = true;
    attempt.submittedAt = now;
    await this.attemptRepo.save(attempt);
    this.logger.log(`Attempt saved – score: ${score}, percentage: ${percentage.toFixed(2)}%`);

    // Save result
    const result = this.resultRepo.create({
      attemptId: attempt.id,
      studentId,
      quizId,
      totalQuestions,
      attemptedQuestions,
      correctAnswers,
      wrongAnswers,
      score: parseFloat(score.toFixed(2)),
      percentage: parseFloat(percentage.toFixed(2)),
    });
    await this.resultRepo.save(result);

    // ── Email notification ────────────────────────────────────────────────────
    if (settings?.emailNotifications) {
      this.logger.log(`emailNotifications: true – looking up student ${studentId}`);
      this.studentsService.findById(studentId).then((student) => {
        if (student && student.email) {
          this.logger.log(`Student email found: ${student.email} – calling EmailService`);
          return this.emailService.sendQuizResult(
            student.email,
            student.fullName || 'Student',
            quiz.title,
            result.score,
            result.percentage,
          );
        } else {
          this.logger.warn(`Student ${studentId} not found or has no email address`);
        }
      }).catch((err) => {
        this.logger.error(`Failed to send email notification for student ${studentId}: ${(err as Error).message}`);
      });
    } else {
      this.logger.log(`emailNotifications: false – skipping email for student ${studentId}`);
    }

    return {
      score: result.score,
      percentage: result.percentage,
      correctAnswers: result.correctAnswers,
      wrongAnswers: result.wrongAnswers,
      totalQuestions: result.totalQuestions,
    };
  }
}
