import { spawn } from 'node:child_process'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const commands = [
  ['run', 'data:twse'], ['run', 'data:twse:stocks'], ['run', 'data:twse:institutional'],
  ['run', 'data:history:repair'], ['run', 'data:history:backfill', '--', '--incremental', '--limit=1082', '--batch-size=20'],
  ['run', 'data:history:repair'], ['run', 'data:technical:rebuild'], ['run', 'data:history:validate'], ['run', 'data:validate'],
]
for (const args of commands) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(npm, args, { stdio: 'inherit', shell: false })
    child.once('error', reject); child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${npm} ${args.join(' ')} failed with code ${code}`)))
  })
}
