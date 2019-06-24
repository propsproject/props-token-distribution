"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_pickby_1 = __importDefault(require("lodash.pickby"));
function toContractFullName(packageName, contractName) {
    if (!packageName)
        return contractName;
    return [packageName, contractName].join('/');
}
exports.toContractFullName = toContractFullName;
function fromContractFullName(contractFullName) {
    if (!contractFullName)
        return {};
    const fragments = contractFullName.split('/');
    const contractName = fragments.pop();
    if (fragments.length === 0)
        return { contract: contractName };
    else
        return lodash_pickby_1.default({ contract: contractName, package: fragments.join('/') });
}
exports.fromContractFullName = fromContractFullName;
//# sourceMappingURL=naming.js.map