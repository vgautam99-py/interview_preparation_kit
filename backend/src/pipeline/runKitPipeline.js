const { performResearch } = require('../services/research.service');
const { generateInitialKitData } = require('../services/question.service');
const { processCoverageAndSecondPass } = require('../services/coverage.service');
const { generateSchedule } = require('../services/schedule.service');
const logger = require('../utils/logger');

/**
 * Shared Pipeline Orchestrator used by both Express HTTP API and CLI batch evaluator.
 * Runs Crawl -> Research -> Generation -> Coverage Check -> Pass 2 (if needed) -> Deterministic Schedule.
 */
async function runKitPipeline(input, statusCallback = null) {
  const { jobDescription, companyUrl, companyName, roleTitle, seniorityLevel, daysAvailable = 5 } = input;
  
  if (!jobDescription || jobDescription.trim().length < 50) {
    throw new Error('Job description must be at least 50 characters long.');
  }

  // Stage 1: Input validated
  if (statusCallback) statusCallback('researching', 'Crawling company website & building research context...');

  // Stage 2 & 3: Crawl & Research
  logger.info(`[Pipeline] Stage 1 & 2: Researching company URL (${companyUrl || 'None'})...`);
  const researchData = await performResearch(companyUrl, jobDescription);

  // Stage 4 & 5: Requirements & Questions AI Generation
  if (statusCallback) statusCallback('generating', 'Extracting requirements and generating structured interview kit...');
  logger.info('[Pipeline] Stage 3: Generating initial kit data (Requirements, Questions, Flashcards)...');
  const initialKit = await generateInitialKitData(
    jobDescription,
    companyUrl,
    researchData,
    companyName,
    roleTitle,
    seniorityLevel,
    daysAvailable
  );

  // Stage 6: Deterministic Coverage Calculation & Pass 2
  if (statusCallback) statusCallback('checking', 'Calculating must-have requirement coverage...');
  logger.info('[Pipeline] Stage 4: Checking requirement coverage & executing Pass 2 if needed...');
  const coverageResult = await processCoverageAndSecondPass(
    initialKit.requirements,
    initialKit.questions,
    initialKit.flashcards
  );

  // Stage 7: Deterministic Schedule Allocation
  if (statusCallback) statusCallback('finalizing', 'Allocating integer-minute schedule across target days...');
  logger.info(`[Pipeline] Stage 5: Allocating ${daysAvailable}-day integer minute schedule...`);
  const scheduleResult = generateSchedule(
    daysAvailable,
    coverageResult.questions,
    initialKit.requirements
  );

  // Final Kit Shape
  const finalKitData = {
    source: initialKit.source,
    company_brief: initialKit.company_brief,
    role: initialKit.role,
    requirements: initialKit.requirements,
    questions: coverageResult.questions,
    flashcards: coverageResult.flashcards,
    schedule: scheduleResult,
    coverage: coverageResult.coverage
  };

  logger.info('[Pipeline] Pipeline execution completed successfully.');
  return finalKitData;
}

module.exports = { runKitPipeline };
