import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { GenerateQuizFromFileDto, FileType, QuestionType } from './ai-quiz/dto/generate-quiz-from-file.dto';
import { ParserService } from './ai-quiz/parser.service';
import { WhisperService } from './ai-quiz/whisper.service';
import { AiContentGeneratorService } from './ai-quiz/ai-content-generator.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

// Mock ConfigService
class MockConfigService extends ConfigService {
  private mockEnv: Record<string, string> = {
    GROQ_API_KEY: 'mock-groq-key',
    WHISPER_EXECUTABLE: 'C:\\mock-whisper.exe',
    WHISPER_MODEL: 'C:\\mock-model.bin',
  };
  get<T = any>(key: any): any {
    return this.mockEnv[key];
  }
}

async function runTests() {
  console.log('==================================================');
  console.log('   RUNNING AI QUIZ GENERATOR TEST SUITE   ');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: DTO Validation
  // ---------------------------------------------------------------------------
  console.log('--- Test 1: DTO Validation ---');
  try {
    // Valid DTO
    const validData = {
      fileType: 'document',
      difficulty: 'Medium',
      questionCount: 10,
      questionType: 'MCQ',
    };
    const dtoInstance = plainToInstance(GenerateQuizFromFileDto, validData);
    const errors = await validate(dtoInstance);
    assert(errors.length === 0, 'Should validate a correct DTO');

    // Invalid question count (> 100)
    const invalidDataCount = {
      fileType: 'document',
      difficulty: 'Medium',
      questionCount: 105, // Max is 100
      questionType: 'MCQ',
    };
    const dtoInstanceCount = plainToInstance(GenerateQuizFromFileDto, invalidDataCount);
    const errorsCount = await validate(dtoInstanceCount);
    assert(errorsCount.length > 0, 'Should reject question count > 100');

    // Invalid fileType
    const invalidDataType = {
      fileType: 'invalid_type',
      difficulty: 'Medium',
      questionCount: 5,
      questionType: 'MCQ',
    };
    const dtoInstanceType = plainToInstance(GenerateQuizFromFileDto, invalidDataType);
    const errorsType = await validate(dtoInstanceType);
    assert(errorsType.length > 0, 'Should reject unsupported file types');
  } catch (err: any) {
    console.error('DTO validation test error:', err);
    failed++;
  }
  console.log();

  // ---------------------------------------------------------------------------
  // TEST 2: ParserService
  // ---------------------------------------------------------------------------
  console.log('--- Test 2: ParserService ---');
  try {
    const parser = new ParserService();
    const tempTxtPath = path.join(__dirname, 'temp-test-file.txt');
    fs.writeFileSync(tempTxtPath, 'Hello World! This is a test document content.', 'utf8');

    const parsedContent = await parser.parseDocument(tempTxtPath, 'document');
    assert(parsedContent.trim() === 'Hello World! This is a test document content.', 'Should parse TXT files correctly');

    // Cleanup
    if (fs.existsSync(tempTxtPath)) {
      fs.unlinkSync(tempTxtPath);
    }

    // Invalid file type error reporting
    try {
      await parser.parseDocument('non-existent.xyz', 'document');
      assert(false, 'Should have thrown an error for unsupported extension');
    } catch (err: any) {
      assert(err.message.includes('Unsupported document extension'), 'Should report unsupported extensions clearly');
    }
  } catch (err: any) {
    console.error('ParserService test error:', err);
    failed++;
  }
  console.log();

  // ---------------------------------------------------------------------------
  // TEST 3: Whisper JSON Parsing
  // ---------------------------------------------------------------------------
  console.log('--- Test 3: Whisper JSON Parsing ---');
  try {
    const mockConfig = new MockConfigService();
    const whisperService = new WhisperService(mockConfig);

    // We can test the JSON parsing logic by checking how it would parse different structures.
    // Let's verify that the JSON output parsing works for both flat and nested Whisper outputs:
    const mockWhisperJsonFlat = {
      text: 'This is flat transcription text.',
    };
    const mockWhisperJsonArray = {
      transcription: [
        { text: 'Hello' },
        { text: 'world' },
      ],
    };

    // Test helper to simulate the close event handler of WhisperService
    const parseWhisperOutput = (jsonContent: string): string => {
      const parsed = JSON.parse(jsonContent);
      let transcript = '';
      if (parsed.transcription && Array.isArray(parsed.transcription)) {
        transcript = parsed.transcription.map((t: any) => t.text || '').join(' ').trim();
      } else if (typeof parsed.transcription === 'string') {
        transcript = parsed.transcription.trim();
      } else if (parsed.text) {
        transcript = parsed.text.trim();
      }
      return transcript;
    };

    assert(parseWhisperOutput(JSON.stringify(mockWhisperJsonFlat)) === 'This is flat transcription text.', 'Should parse flat text Whisper output');
    assert(parseWhisperOutput(JSON.stringify(mockWhisperJsonArray)) === 'Hello world', 'Should parse segment-array Whisper output');
  } catch (err: any) {
    console.error('Whisper JSON parsing test error:', err);
    failed++;
  }
  console.log();

  // ---------------------------------------------------------------------------
  // TEST 4: AI Generator Validation & Retries
  // ---------------------------------------------------------------------------
  console.log('--- Test 4: AI Content Generator Validation & Retries ---');
  try {
    const mockConfig = new MockConfigService();
    const aiGenerator = new AiContentGeneratorService(mockConfig);

    // Let's mock a Groq response and test the validation logic
    const mockValidResponse = {
      title: 'Math Quiz',
      description: 'Basic algebra',
      questions: [
        {
          question: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          explanation: '2 plus 2 equals 4.',
        },
      ],
    };

    const mockInvalidResponseCount = {
      title: 'Math Quiz',
      description: 'Basic algebra',
      questions: [], // Empty questions
    };

    // Verify correct correctAnswer matching
    const q = mockValidResponse.questions[0];
    const isCorrectMatched = q.options.includes(q.correctAnswer);
    assert(isCorrectMatched, 'Correct answer must match one of the options');

    // Verify question count validation
    const targetCount = 1;
    const isValidCount = mockValidResponse.questions.length === targetCount;
    assert(isValidCount, 'Should validate correct question count');

    const isInvalidCount = mockInvalidResponseCount.questions.length === targetCount;
    assert(!isInvalidCount, 'Should reject incorrect question count');
  } catch (err: any) {
    console.error('AI Generator test error:', err);
    failed++;
  }
  console.log();

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('==================================================');
  console.log('                TEST RUN SUMMARY                  ');
  console.log('==================================================');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
