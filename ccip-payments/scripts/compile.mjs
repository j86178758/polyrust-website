import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import solc from 'solc'

const root = fileURLToPath(new URL('../', import.meta.url))
const sources = {}
function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) collect(path)
    else if (entry.name.endsWith('.sol')) sources[relative(root, path)] = { content: readFileSync(path, 'utf8') }
  }
}
collect(resolve(root, 'contracts'))
const output = JSON.parse(solc.compile(JSON.stringify({
  language: 'Solidity', sources,
  settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'shanghai', outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } } },
}), { import: path => {
  // CCIP 2.0 uses this version-qualified official OZ import; resolve to our pinned 5.3.0 package.
  const normalized = path.replace('@openzeppelin/contracts@5.3.0/', '@openzeppelin/contracts/')
  try { return { contents: readFileSync(resolve(root, 'node_modules', normalized), 'utf8') } }
  catch { return { error: `Cannot resolve Solidity import: ${path}` } }
} }))
for (const error of output.errors ?? []) console[error.severity === 'error' ? 'error' : 'warn'](error.formattedMessage)
if (output.errors?.some(error => error.severity === 'error')) process.exit(1)
mkdirSync(resolve(root, 'artifacts'), { recursive: true })
for (const [source, contracts] of Object.entries(output.contracts)) {
  if (!source.startsWith('contracts/')) continue
  for (const [name, contract] of Object.entries(contracts)) {
    if (!contract.evm.bytecode.object) continue
    writeFileSync(resolve(root, 'artifacts', `${name}.json`), JSON.stringify({ contractName: name, compiler: solc.version(), abi: contract.abi, bytecode: `0x${contract.evm.bytecode.object}` }, null, 2) + '\n')
    console.log(`Compiled ${name}: ${contract.evm.deployedBytecode.object.length / 2} deployed bytes`)
  }
}
