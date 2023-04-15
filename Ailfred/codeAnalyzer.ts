const slither = require('slither-analyzer');
const mythril = require('mythril');
const manticore = require('manticore');

interface Finding {
  tool: string;
  title: string;
  description: string;
  solidityFile: string;
  line: number;
  address: string;
}

export class CodeAnalyzer {
  constructor(private repoPath: string) {}

  getAutomatedFindings(): Finding[] {
    const automatedFindings: Finding[] = [];

    // Slither analysis
    const slitherResults = slither.run(this.repoPath);
    for (const result of slitherResults) {
      automatedFindings.push({
        tool: 'Slither',
        title: result.checkName,
        description: result.description,
        solidityFile: result.filename,
        line: result.line,
        address: result.address
      });
    }

    // Mythril analysis
    const mythrilResults = mythril.analyze(this.repoPath);
    for (const result of mythrilResults.issues) {
      automatedFindings.push({
        tool: 'Mythril',
        title: result.title,
        description: result.description,
        solidityFile: result.filename,
        line: result.location,
        address: result.debug['calldata']['address']
      });
    }

    // Manticore analysis
    const manticoreResults = manticore.run(`${this.repoPath}/contracts`, `${this.repoPath}/manticore`);
    for (const result of manticoreResults) {
      automatedFindings.push({
        tool: 'Manticore',
        title: result.name,
        description: result.description,
        solidityFile: result.contract,
        line: result.line,
        address: result.state['Active contracts'][0]
      });
    }
    return automatedFindings;
  }
}
