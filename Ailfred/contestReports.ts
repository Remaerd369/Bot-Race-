const https = require('https');
const csvParser = require('csv-parser');

interface Report {
  title: string;
  severity: string;
}

export class ContestReports {
  constructor(private vulnerabilityDB: any) {}

  getReports(): { [key: string]: Report } {
    const reports: { [key: string]: Report } = {};

    https.get('https://code4rena.com/reports', (res: any) => {
      let rawData = '';
      res.on('data', (chunk: any) => { rawData += chunk; });
      res.on('end', () => {
        const reportsTable = rawData.match(/<!-- START: reports table -->([\s\S]*?)<!-- END: reports table -->/gmi)![0];
        const reportsCsv = reportsTable.match(/<pre>[\s\S]*<\/pre>/gmi)![0].replace(/(<pre>|<\/pre>|&nbsp;)/g, '').trim();
        const csvData = csvParser.parse(reportsCsv, {
          skipLines: 2,
          headers: ['id', 'title', 'severity']
        });
        for (const row of csvData) {
          if (!this.vulnerabilityDB.hasOwnProperty(row.id)) {
            const severity = row.severity;
            const title = row.title;
            let key;
            switch (severity) {
              case 'Critical':
                key = `H-${Date.now()}-${row.id}`;
                break;
              case 'High':
                key = `M-${Date.now()}-${row.id}`;
                break;
              case 'Medium':
                key = `L-${Date.now()}-${row.id}`;
                break;
              default:
                key = `N-${Date.now()}-${row.id}`;
            }
            reports[key] = {
              title: title,
              severity: severity
            };
          }
        }
      });
    });

    return reports;
  }
}
