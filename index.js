const fs = require('fs')
const path = require('path')
const DocBuilder = require('tiny-attribution-generator/lib/docbuilder').default
const TextRenderer = require('tiny-attribution-generator/lib/outputs/text')
  .default
const ClearlyDefinedSource = require('tiny-attribution-generator/lib/inputs/clearlydefined')
  .default
const JsonRenderer = require('tiny-attribution-generator/lib/outputs/json')
  .default
const PackageLockSource = require('tiny-attribution-generator/lib/inputs/packagelock')
  .default
const request = require('superagent')

const jsonRenderer = new JsonRenderer()
const jsonBuilder = new DocBuilder(jsonRenderer)
const clearlyDefinedBuilder = new DocBuilder(new TextRenderer())

const noticesBranchName = 'notices'
const packageData = fs.readFileSync(
  path.join(process.env.GITHUB_WORKSPACE, 'package-lock.json')
)

async function go() {
  const packageLockSource = new PackageLockSource(packageData.toString())
  await jsonBuilder.read(packageLockSource)
  const jsonOutput = await jsonBuilder.build()
  const clearlydefinedInput = {
    coordinates: jsonOutput.packages.map(x =>
      x.name.indexOf('/') > -1 ?
      `npm/npmjs/${x.name}/${x.version}` :
      `npm/npmjs/-/${x.name}/${x.version}`
    )
  }
  await clearlyDefinedBuilder.read(
    new ClearlyDefinedSource(JSON.stringify(clearlydefinedInput))
  )

  const output = clearlyDefinedBuilder.build()
  const base64Output = Buffer.from(output).toString('base64')

  console.log('generated notices')

  // get a ref to the default branch
  const master = await getBranch('master')
  const noticeBranch = await getBranch(noticesBranchName)
  if (
    noticeBranch &&
    noticeBranch.body.ref == `refs/heads/${noticesBranchName}`
  ) {
    // todo: see if this branch is out of date and rebase it instead of quitting
    console.log('branch already exists')
    return
  }

  // create branch off master
  await createBranch(noticesBranchName, master.body.object.sha)

  // get the notice file
  let existingFileSha = null
  const existingFile = await getFile('NOTICES', 'master')
  if (existingFile) {
    existingFileSha = existingFile.body.sha
    const normalizedExistingFile = Buffer.from(existingFile.body.content, 'base64').toString().replace(/\s/g, '')
    const normalizedOutput = output.toString().replace(/\s/g, '')
    if (normalizedExistingFile == normalizedOutput) {
      console.log('No change to existing NOTICES file')
      return
    }
  }

  // todo: update vs create may be different endpoints
  // update notice file in the notices branch
  await writeFile('NOTICES', base64Output, noticesBranchName, existingFileSha)

  // open PR notices -> master
  await openPr(noticesBranchName, 'master')
}

go()

async function getBranch(branch) {
  console.log('getting branch: ' + branch)
  try {
    const response = await request
      .get(
        `https://api.github.com/repos/${
          process.env.GITHUB_REPOSITORY
        }/git/refs/heads/${branch}`
      )
      .auth(process.env.GITHUB_TOKEN, {
        type: 'bearer'
      })
      .send()
    return response
  } catch (e) {
    return null
  }
}

function createBranch(branchName, fromSha) {
  console.log('creating branch: ' + branchName + ' from ' + fromSha)
  return request
    .post(
      `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/git/refs`
    )
    .auth(process.env.GITHUB_TOKEN, {
      type: 'bearer'
    })
    .send({
      ref: `refs/heads/${branchName}`,
      sha: fromSha
    })
}

async function getFile(filePath, branchName) {
  console.log('getting file: ' + filePath + ' from ' + branchName)
  try {
    const response = await request
      .get(
        `https://api.github.com/repos/${
          process.env.GITHUB_REPOSITORY
        }/contents/${filePath}`
      )
      .auth(process.env.GITHUB_TOKEN, {
        type: 'bearer'
      })
      .query({
        ref: branchName
      })
    return response
  } catch (e) {
    return null
  }
}

function writeFile(filePath, content, branchName, currentSha) {
  console.log('writing file: ' + filePath + ' to ' + branchName)
  const payload = {
    message: 'update NOTICES',
    committer: {
      name: 'dabutvin',
      email: 'butvinik@outlook.com'
    },
    content,
    branch: branchName
  }
  if (currentSha) {
    payload.sha = currentSha
  }
  return request
    .put(
      `https://api.github.com/repos/${
        process.env.GITHUB_REPOSITORY
      }/contents/${filePath}`
    )
    .auth(process.env.GITHUB_TOKEN, {
      type: 'bearer'
    })
    .send(payload)
}

function openPr(head, base) {
  console.log('opening pr from ' + head + ' to ' + base)
  return request
    .post(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls`)
    .auth(process.env.GITHUB_TOKEN, {
      type: 'bearer'
    })
    .send({
      title: 'NOTICE file updates',
      body: 'Please pull this in!',
      head,
      base
    })
}
