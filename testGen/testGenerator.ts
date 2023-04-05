// Automatic Solidity Contracts Unit Test Structure Generator
//
// Currently supports files that have only one contract in them.
// Will probably work with files which have more but the output may not be as desired
//
// To run type the following in console:
// yarn testgen CONTRACT_FILE_PATH_IN_CONTRACTS
// 
// You can input any number of contracts as arguments
//
// The path needs to be input relative to the "./contracts" folder, e.g.:
// "./contracts/Bank/Bank.sol" => "Bank/Bank.sol"

// TODO change paths to absolute paths

import * as fs from 'fs';
import { emptyTest } from "./testTemplate"

/* =====================================================
                    CONSTANTS
===================================================== */

// Regular expressions used in contract code and path analysis
const functionRegex             = new RegExp(/function\s\w+\([\w\s,\[\]\*\/]*\)[\r\n\s\w\(\),]+{/,'g'),
    functionNameRegex           = new RegExp(/function\s(\w+)/),
    // Add any other variable type expected after `bool`
    publicVariableRegex         = new RegExp(/(bytes32|uint256|address|bool)\s[\w\s]*public\s\w+\s*[;|=]/,'g'),
    variableNameRegex           = new RegExp(/public\s(\w+)/),
    contractDefinitionRegexA    = new RegExp(/contract\s(\w+)\sis/),
    contractDefinitionRegexB    = new RegExp(/contract\s(\w+)\s{/),
    folderRegex                 = new RegExp(/(\w+\/)\w+.sol/);

// Visibilities array
const visibility = [
        "external", // 0
        "public",   // 1
        "internal", // 2
        "private"   // 3
    ];

const testGen = "TestGen: "

/* =====================================================
                        FUNCTIONS
===================================================== */

// Clone folder structure from "./contracts"
//
// Currently supports one level of nesting:
// "./contracts/types/ERC20.sol"                — will work
// "./contracts/types/ExtraFolder/ERC20.sol"    — will not work
function createContractFolder(contract: string, folderString: string | RegExpMatchArray): string | RegExpMatchArray {
    // Match contract definition statement if contract inherits from other contracts
    let definition = contract.match(contractDefinitionRegexA),
        name: string | RegExpMatchArray;

    // Match contract definition statement if contract doesn't inherit from other contracts
    if (definition == null) {
        definition = contract.match(contractDefinitionRegexB)
    }

    // Change type to insert into string
    name = definition == null ? "" : definition[1];

    // Log current contract
    if (name != "") {
        console.log(`========================================================\n${testGen} Contract: ${name}`);
    } else {
        console.log(`${testGen} Contract name not found`);
    }
    
    let newPath;

    // If contracts are nested in a folder
    if (folderString != "") {
        // Create a higher level folder first
        newPath = `./test/${folderString}`;
        if (!fs.existsSync(newPath)){
            fs.mkdirSync(newPath);
        }

        // Then create contract folder
        newPath = newPath + `/${name}`;
        if (!fs.existsSync(newPath)){
            fs.mkdirSync(newPath);
        }
    }
    // If the contract is placed directly in the "./contrats" folder
    else {
        // Create folder for contract
        newPath = `./test/${name}`;
        if (!fs.existsSync(newPath)){
            fs.mkdirSync(newPath);
        }

    }

    // Return created path
    return newPath;
}

// Scoop out the avriable name
function createVariableFiles(variablesArray: RegExpMatchArray | null, contractName: string | RegExpMatchArray) {
    let outputArray: string[] = [],
        variables: string | RegExpMatchArray,
        match: RegExpMatchArray | null,
        name: string | RegExpMatchArray,
        newPath;

    // Change type to insert into string
    variables = variablesArray == null ? "" : variablesArray

    // Push all variables with given parameter to outputArray
    for(let i=0; i<variables.length;i++){
        outputArray.push(variables[i]);
    }

    // Log array summary
    console.log(`${testGen} Found ${outputArray.length} public variables`);

    // For each variable create a test file
    for(let i=0; i<variables.length;i++){
        match = variables[i].match(variableNameRegex);
        // Change type to insert into string
        name = match == null ? "" : match;

        // Get file path
        newPath = `${contractName}/${name[1]}.test.ts`;
        // Create file and put empty test template in it
        fs.appendFile(newPath, emptyTest(contractName.toString(), name[1]), () => {});

        console.log(`${testGen} Test file for ${name[1]} created`);
    }
}

// Scoop out only functions with a given parameter, e.g.: external, onlyAdmin, etc
function getFunctionsBy(parameter: string, functionArray: RegExpMatchArray | null): string[] {
    let outputArray: string[] = [],
        functions: string | RegExpMatchArray;

    // Change type to insert into string
    functions = functionArray == null ? "" : functionArray

    // Push all functions with given parameter to outputArray
    for(let i=0; i<functions.length;i++){
        if(functions[i].match(parameter)){
            outputArray.push(functions[i]);
        }
    }

    // Log array summary
    console.log(`${testGen} Found ${outputArray.length} ${parameter} functions`)

    return outputArray;
}

// Create function test files
function createFunctionFiles(functions: string[], contractName: string | RegExpMatchArray) {
    let match: RegExpMatchArray | null,
        name: string | RegExpMatchArray,
        newPath;

    // For each function create a test file
    for(let i=0; i<functions.length;i++){
        match = functions[i].match(functionNameRegex);
        // Change type to insert into string
        name = match == null ? "" : match;

        // Get file path
        newPath = `${contractName}/${name[1]}.test.ts`;
        // Create file and put empty test template in it
        fs.appendFile(newPath, emptyTest(contractName.toString(), name[1]), () => {});

        console.log(`${testGen} Test file for ${name[1]} created`);
    }
}

/* =====================================================
                        EXECUTION
===================================================== */

console.log(`${testGen} ${process.argv.length - 2} contracts to analyze`);

let path,
    fileString,
    allFunctions,
    allPublicVariables,
    input: string,
    folderMatch: null | RegExpMatchArray,
    folderString: string | RegExpMatchArray;

// For each file passed as argument to the execution create tests for `external and `public` functions
for (let i = 2; i < process.argv.length; i++) {
    // Get argument
    input = process.argv[i];
    // Get full path in `contracts` folder
    path = "./contracts/" + input;

    // Get contract code as string
    fileString = fs.readFileSync(path,'utf8');

    // Get all functions from contrat
    allPublicVariables = fileString.match(publicVariableRegex);

    // Get all functions from contrat
    allFunctions = fileString.match(functionRegex);

    // Check if contracts are nested in a folder
    folderMatch = input.match(folderRegex);

    // Change type to insert into string
    folderString = folderMatch == null ? "" : folderMatch[1];

    // Create contract folder in `./test` directory and get tests directory path
    const testPath = createContractFolder(fileString, folderString);
    createVariableFiles(allPublicVariables, testPath);
    // Create files for external functions
    createFunctionFiles(getFunctionsBy(visibility[0], allFunctions), testPath);
    // Create files for public functions
    createFunctionFiles(getFunctionsBy(visibility[1], allFunctions), testPath);
}


