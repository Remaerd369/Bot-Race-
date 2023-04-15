import csv from 'fast-csv';

interface VulnerabilityReport {
  id: string;
  title: string;
}

interface AuditFindings {
  high_risk: VulnerabilityReport[];
  medium_risk: VulnerabilityReport[];
  low_risk: VulnerabilityReport[];
  non_critical: VulnerabilityReport[];
  gas_optimizations: VulnerabilityReport[];
}

export class ReportGenerator {
  constructor(private auditFindings: AuditFindings, private automatedFindings: any[]) {}

  async generateReport(): Promise<string> {
    let report = '';

    // Automated findings report
    report += '[Automated Findings Report]\n';
    const automatedFindingsCsv = await csv.writeToString(this.automatedFindings);
    report += automatedFindingsCsv.replace(/,/g, '\t');

    // Audit report
    report += '\n\n[Audit Report]\n';
    for (const key in this.auditFindings) {
      if (this.auditFindings.hasOwnProperty(key)) {
        report += `\n[${key.replace('_', ' ').toUpperCase()}]\n`;
        const auditFindingsCsv = await csv.writeToString(this.auditFindings[key]);
        report += auditFindingsCsv.replace(/,/g, '\t');
      }
    }

    return report;
  }
}
