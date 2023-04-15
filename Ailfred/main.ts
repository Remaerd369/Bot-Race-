import { GitHelper } from "./gitHelper";
import { CodeAnalyzer } from "./codeAnalyzer";
import { VulnerabilitiesDetector } from "./vulnerabilityDetector";
import { AuditAgent } from "./auditAgent";
import { ReportGenerator } from "./generateReport";

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter GitHub repository URL: ', (repoUrl: string) => {
  (async () => {
    const gitHelper = new GitHelper(repoUrl);
    const repoPath = gitHelper.clone();
    const codeAnalyzer = new CodeAnalyzer(repoPath);
    const automatedFindings = codeAnalyzer.getAutomatedFindings();
    const vulnerabilitiesDetector = new VulnerabilitiesDetector(repoPath);
    const vulnerabilities = vulnerabilitiesDetector.getVulnerabilities(automatedFindings);
    const auditAgent = new AuditAgent(vulnerabilities);
    const auditFindings = auditAgent.getAuditFindings();
    const reportGenerator = new ReportGenerator(auditFindings, automatedFindings);
    const report = await reportGenerator.generateReport();
    console.log(report);
    rl.close();
  })();
});
