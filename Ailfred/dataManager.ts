import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import { nameRegex, emptyTest } from './testTemplate';


interface ContestReport {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

interface CustomVulnerabilityReport {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  recommendation: string;
}

export class DataManager {
  private client: MongoClient;
  private db: any;
  private contestCollection: any;
  private customCollection: any;

  constructor(private dbUri: string) {
    this.client = new MongoClient(dbUri);
    this.client
      .connect()
      .then(() => {
        console.log(`Connected to MongoDB at ${dbUri}`);
        this.db = this.client.db();
        this.contestCollection = this.db.collection('contest_reports');
        this.customCollection = this.db.collection('custom_reports');
      })
      .catch((err) => console.log(`Error connecting to MongoDB: ${err}`));
  }

  async addContestReport(report: ContestReport): Promise<void> {
    // Check if the report already exists in the database
    const existingReport = await this.contestCollection.findOne({ id: report.id });
    if (existingReport) {
      console.log(`Contest report ${report.id} already exists in the database`);
      return;
    }

    // Insert the report into the contest_reports collection
    this.contestCollection.insertOne(report, (err, result) => {
      if (err) {
        console.error(`Error adding contest report ${report.id} to database: ${err}`);
      } else {
        console.log(`Contest report ${report.id} added to database`);
      }
    });
  }

  async addCustomReport(report: CustomVulnerabilityReport): Promise<void> {
    // Check if the report already exists in the database
    const existingReport = await this.customCollection.findOne({ id: report.id });
    if (existingReport) {
      console.log(`Custom report ${report.id} already exists in the database`);
      return;
    }

    // Insert the report into the custom_reports collection
    this.customCollection.insertOne(report, (err, result) => {
      if (err) {
        console.error(`Error adding custom report ${report.id} to database: ${err}`);
      } else {
        console.log(`Custom report ${report.id} added to database`);
      }
    });
  }

  async generateTestSuite(filePaths: string[]): Promise<void> {
    const functionRegex = new RegExp(/function\s\w+\([\w\s,\[\]\*\/]*\)[\r\n\s\w\(\),]+{/,'g');
    const functionNameRegex = new RegExp(/function\s(\w+)/);
    const publicVariableRegex = new RegExp(/(bytes32|uint256|address|bool)\s[\w\s]*public\s\w+\s*[;|=]/,'g');
    const variableNameRegex = new RegExp(/public\s(\w+)/);
    const contractDefinitionRegexA = new RegExp(/contract\s(\w+)\sis/);
    const contractDefinitionRegexB = new RegExp(/contract\s(\w+)\s{/);
    const folderRegex = new RegExp(/(\w+\/)\w+.sol/);
    const visibility = ["external", "public", "internal", "private"];

    for (let filePath of filePaths) {
      console.log(`Generating test suite for ${filePath}...`);

      // Get full path in `contracts` folder
      const fullPath = "./contracts/" + filePath;

      // Get contract code as string
      const contractCode = fs.readFileSync(fullPath,'utf8');

      // Get all public variables from contract
      const allPublicVariables = contractCode.match(publicVariableRegex);

      // Get all functions from contract
      const allFunctions = contractCode.match(functionRegex);

      // Check if contract is nested in a folder
      const folderMatch = filePath.match(folderRegex);
      const folderString = folderMatch == null ? "" : folderMatch[1];

      // Create contract folder in `./test` directory and get tests directory path
      const testPath = this._createContractFolder(contractCode, folderString);

      // Create test files for public variables
      this._createVariableFiles(allPublicVariables, testPath);

      // Create test files for external and public functions
      for (let v of [visibility[0], visibility[1]]) {
        const functions = this._getFunctionsBy(v, allFunctions);
        this._createFunctionFiles(functions, testPath, v);
      }

      // Create test file for internal and private functions
      const functions = this._get    FunctionsBy("internal", allFunctions).concat(
        this._getFunctionsBy("private", allFunctions)
      );
      this._createFunctionFiles(functions, testPath, "internal");
    }

    console.log(`Test suite generated for ${filePath}`);
  }

  private _createContractFolder(contractCode: string, folderString: string): string {
    // Get contract name from code
    const contractName = contractCode.match(/contract\s(\w+)\s?{/i)[1];

    // Sanitize the contract name for use in file paths
    const sanitizedContractName = contractName.charAt(0).toUpperCase() + contractName.slice(1).replace(/_/g, "");

    // Create folder name for contract test suite
    const sanitizedFolderString = folderString.replace(/\//g, "").replace(/_/g, "");
    const testFolderName = sanitizedFolderString + sanitizedContractName + "Test";

    // Create the contract test suite folder
    const testFolderPath = `./test/${testFolderName}`;
    fs.mkdirSync(testFolderPath);

    // Create the `helper.sol` file inside the test suite folder
    const helperFileContent = "pragma solidity ^0.8.0;\n\ncontract Helper {}\n";
    const helperFilePath = `${testFolderPath}/Helper.sol`;
    fs.writeFileSync(helperFilePath, helperFileContent);

    // Return the `./test/<sanitizedFolderString><sanitizedContractName>Test` path
    return testFolderPath;
  }

  private _createVariableFiles(variables: RegExpMatchArray | null, testPath: string) {
    if (variables == null) return;
    for (let variable of variables) {
      const variableName = variable.match(variableNameRegex)[1];
      const testFilePath = `${testPath}/${variableName}.sol`;
      const testFileContent = emptyTest.replace(/<TestName>/g, variableName);
      fs.writeFileSync(testFilePath, testFileContent);
    }
  }

  private _createFunctionFiles(functions: RegExpMatchArray, testPath: string, visibility: string) {
    const matchRegex = new RegExp(`function\\s\\w+\\(${visibility}[\\w\\s,\\[\\]\\*\\/]*\\)\\s(external|internal)\\s\\{`, 'gm');
    for (let func of functions) {
      const funcName = func.match(functionNameRegex)[1];
      const testFileContent = this._generateTestFileContent(func, visibility);
      const testFilePath = `${testPath}/${funcName}.sol`;
      fs.writeFileSync(testFilePath, testFileContent);
    }
  }

  private _getFunctionsBy(visibility: string, functions: RegExpMatchArray): RegExpMatchArray {
    const matchRegex = new RegExp(`function\\s\\w+\\(${visibility}[\\w\\s,\\[\\]\\*\\/]*\\)\\s(external|internal)\\s\\{`, 'gm');
    const publicFunctions = functions.join(" ").match(matchRegex);
    return publicFunctions == null ? [] : publicFunctions;
  }

  private _generateTestFileContent(func: string, visibility: string): string {
    const contractName = func.match(contractDefinitionRegexA)[1] || func.match(contractDefinitionRegexB)[1];
    const folderMatch = contractName == null ? "" : contractName[1];
    const sanitizedFolderString = folderMatch.replace(/\//g, "").replace(/_/g, "");
    let testFileContent = `pragma solidity ^0.8.0;\n\nimport "../contracts/${folderString}${contractName}.sol";\n\n`;
    testFileContent += `contract Test${func.match(functionNameRegex)[1].charAt(0).toUpperCase() + func.match(functionNameRegex)[1].slice(1)} {\n\n`;
    testFileContent += `  ${contractName} ${visibility} c;\n\n`;
    testFileContent += `  function beforeEach() external {\n`;
    testFileContent += `    c = new ${contractName}();\n`;
    testFileContent += `  }\n\n`;
    testFileContent += `  // TODO: Write ${func.match(functionNameRegex)[1]} tests\n\n}`;
    return testFileContent;
  }
}
closeConnection(): void {
  this.client.close();
  console.log(`Connection closed to ${this.dbUri}`);
}
}

export const dataManager = new DataManager(process.env.DB_URI || "mongodb://localhost:27017/mydb");



//To integrate the test suite generator script into this class, I added an `async generateTestSuite(filePaths: string[]): Promise<void>` method that takes an array of file paths as an input. This method uses regular expressions to parse the contract code and generate test files for each public variable and function in the contract.

//To use the `generateTestSuite` method, you can create a new instance of the `DataManager` class and call the `generateTestSuite` method on it, passing in an array of file paths for the contracts you want to generate test suites for.

//Let me know if you have any questions or concerns!