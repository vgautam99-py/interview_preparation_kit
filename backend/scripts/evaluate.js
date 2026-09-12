const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { runKitPipeline } = require('../src/pipeline/runKitPipeline');
const logger = require('../src/utils/logger');

async function main() {
  const args = process.argv.slice(2);
  let inputPath = null;
  let outputPath = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      inputPath = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    }
  }

  if (!inputPath || !outputPath) {
    console.error('Usage: npm run evaluate -- --input <input.json> --output <output.json>');
    process.exit(1);
  }

  const absoluteInputPath = path.resolve(inputPath);
  const absoluteOutputPath = path.resolve(outputPath);

  if (!fs.existsSync(absoluteInputPath)) {
    console.error(`Input file not found at: ${absoluteInputPath}`);
    process.exit(1);
  }

  logger.info(`[Evaluate CLI] Reading evaluation inputs from ${absoluteInputPath}...`);
  const fileRaw = fs.readFileSync(absoluteInputPath, 'utf8');
  let inputData = JSON.parse(fileRaw);

  if (!Array.isArray(inputData)) {
    inputData = [inputData];
  }

  const results = [];

  for (let idx = 0; idx < inputData.length; idx++) {
    const caseInput = inputData[idx];
    const caseId = caseInput.id || `case_${idx + 1}`;
    
    logger.info(`[Evaluate CLI] Processing evaluation case ${idx + 1}/${inputData.length} (${caseId})...`);

    const jd = caseInput.jobDescription || caseInput.jd || caseInput.job_description || '';
    const companyUrl = caseInput.companyUrl || caseInput.company_url || caseInput.url || '';
    const daysAvailable = parseInt(caseInput.daysAvailable || caseInput.days || 3, 10);

    try {
      const kitData = await runKitPipeline({
        jobDescription: jd,
        companyUrl,
        daysAvailable
      });

      results.push({
        id: caseId,
        status: 'ok',
        kit: kitData
      });
      logger.info(`[Evaluate CLI] Case ${caseId} completed successfully (status=ok).`);

    } catch (err) {
      logger.error(`[Evaluate CLI] Case ${caseId} failed: ${err.message}`);
      results.push({
        id: caseId,
        status: 'failed',
        error: err.message
      });
    }
  }

  // Write output
  const outputDir = path.dirname(absoluteOutputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(absoluteOutputPath, JSON.stringify(results, null, 2), 'utf8');
  logger.info(`[Evaluate CLI] Evaluation complete! Results written to ${absoluteOutputPath}`);
}

main().catch(err => {
  console.error('[Evaluate CLI] Critical error:', err);
  process.exit(1);
});
