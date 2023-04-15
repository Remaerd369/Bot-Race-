import { createReadStream, promises as fs } from 'fs';
import csv from 'fast-csv';
import { DataManager } from './DataManager';

interface VulnerabilityReport {
  id: string;
  title: string;
}

async function parseReport(filePath: string): Promise<VulnerabilityReport[]> {
  const stream = createReadStream(filePath);

  return new Promise<VulnerabilityReport[]>((resolve, reject) => {
    const reports: VulnerabilityReport[] = [];
    csv.parseStream(stream, { headers: true, delimiter: '\t' })
      .on('error', reject)
      .on('data', (row) => {
        const report: VulnerabilityReport = { id: row.id, title: row.title };
        reports.push(report);
      })
      .on('end', () => resolve(reports));
  });
}

async function generateTestSuites(inputDir: string, outputDir: string) {
  const reports = await parseReport(`${inputDir}/reports.csv`);
  const dataManager = new DataManager();

  const testSuites = dataManager.generateTestSuite(reports);

  // Write test files to disk
  await Promise.all(testSuites.map(async (testSuite) => {
    const fileName = `${outputDir}/${testSuite.name}.test.js`;
    await fs.writeFile(fileName, testSuite.contents);
    console.log(`test suite written to ${fileName}`);
  }));
}

generateTestSuites('./input', './output');