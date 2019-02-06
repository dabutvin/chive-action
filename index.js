const fs = require('fs')
const path = require('path')
const argv = require('yargs').argv
const DocBuilder = require('tiny-attribution-generator/lib/docbuilder').default
const TextRenderer = require('tiny-attribution-generator/lib/outputs/text')
  .default
const TemplateRenderer = require('tiny-attribution-generator/lib/outputs/template')
  .default
const ClearlyDefinedSource = require('tiny-attribution-generator/lib/inputs/clearlydefined')
  .default
const JsonRenderer = require('tiny-attribution-generator/lib/outputs/json')
  .default
const PackageLockSource = require('tiny-attribution-generator/lib/inputs/packagelock')
  .default
const request = require('superagent')

if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required!')

const noticesFileName = argv.filename || 'NOTICE'
const includeDev = argv.includeDev || false
const noticesBranchName = 'notices'
const packageData = fs.readFileSync(
  path.join(process.env.GITHUB_WORKSPACE, 'package-lock.json')
)
const customTemplate = findCustomTemplate()

const jsonRenderer = new JsonRenderer()
const jsonBuilder = new DocBuilder(jsonRenderer)
const outputRenderer = customTemplate
  ? new TemplateRenderer(customTemplate)
  : new TextRenderer()
const clearlyDefinedBuilder = new DocBuilder(outputRenderer)

async function go() {
  const packageLockSource = new PackageLockSource(
    packageData.toString(),
    !includeDev
  )
  await jsonBuilder.read(packageLockSource)
  const jsonOutput = await jsonBuilder.build()
  const coordinates = jsonOutput.packages.map(x =>
    x.name.indexOf('/') > -1
      ? `npm/npmjs/${x.name}/${x.version}`
      : `npm/npmjs/-/${x.name}/${x.version}`
  )
  if (!coordinates.length) {
    console.log('no components detected')
    return
  }
  const clearlydefinedSource = new ClearlyDefinedSource(
    JSON.stringify({
      coordinates
    })
  )
  await clearlyDefinedBuilder.read(clearlydefinedSource)
  const output = clearlyDefinedBuilder.build()
  const base64Output = Buffer.from(output).toString('base64')
  console.log('generated notices')

  // get a ref to the default branch
  const master = await getBranch('master')

  // get a ref to the notices branch
  const noticeBranch = await getBranch(noticesBranchName)
  if (
    noticeBranch &&
    noticeBranch.body.ref == `refs/heads/${noticesBranchName}`
  ) {
    // todo: see if this branch is out of date and rebase it instead of quitting
    console.log('branch already exists')
    return
  }

  // get the existing notice file in the default branch
  let existingFileSha = null
  const existingFile = await getFile(noticesFileName, 'master')
  if (existingFile) {
    existingFileSha = existingFile.body.sha
    const normalizedExistingFile = Buffer.from(
      existingFile.body.content,
      'base64'
    )
      .toString()
      .replace(/\s/g, '')
    const normalizedOutput = output.toString().replace(/\s/g, '')
    if (normalizedExistingFile == normalizedOutput) {
      console.log(`No change to existing ${noticesFileName} file`)
      return
    }
  }

  // create a new notices branch off the default branch
  await createBranch(noticesBranchName, master.body.object.sha)

  // update notice file in the notices branch
  await writeFile(
    noticesFileName,
    base64Output,
    noticesBranchName,
    existingFileSha
  )

  // open PR notices -> master
  await openPr(
    noticesBranchName,
    'master',
    getPrBody(coordinates, clearlydefinedSource)
  )
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
    message: `update ${noticesFileName}`,
    committer: {
      name: 'clearlydefinedbot',
      email: '34585460+clearlydefinedbot@users.noreply.github.com'
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

function openPr(head, base, body) {
  console.log('opening pr from ' + head + ' to ' + base)
  return request
    .post(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls`)
    .auth(process.env.GITHUB_TOKEN, {
      type: 'bearer'
    })
    .send({
      title: `${noticesFileName} file updates`,
      body,
      head,
      base
    })
}

function findCustomTemplate() {
  const locations = [
    path.join(process.env.GITHUB_WORKSPACE, 'NOTICE_TEMPLATE'),
    path.join(process.env.GITHUB_WORKSPACE, '.github/NOTICE_TEMPLATE')
  ]
  for (let location of locations) {
    if (fs.existsSync(location)) return fs.readFileSync(location).toString()
  }
}

function getPrBody(coordinates, clearlydefinedSource) {
  let licenseAvailable = 0
  let rows = coordinates
    .map(x => {
      let pkg = clearlydefinedSource.getPackage(x) || {
        license: '',
        website: ''
      }
      if (pkg.license) licenseAvailable++
      return `| ${x} | ${pkg.license} | ${pkg.website} | ${yesno(
        pkg.copyrights && pkg.copyrights.length
      )} | ${yesno(pkg.text)} |\n`
    })
    .sort((a, b) => (b.license ? 1 : -1))
  let result = '## Holy chives! Your notices are updated!\n\n'
  result += `We found license information for  ${licenseAvailable} of ${
    coordinates.length
  } total components ${licenseAvailable > 0 ? '🎉' : ''}\n\n`

  if (rows.length > 400) {
    result +=
      'The following report has been truncated to fit within the pull request body\n\n'
    rows = rows.slice(0, 400)
  }

  result += '<details>\n<summary>\nDetails\n</summary>\n\n'
  result +=
    '| Package | License | Website | Copyrights available | License text available |\n'
  result += '|--|--|--|--|--|\n'
  rows.forEach(x => {
    result += x
  })
  result += '</details>\n\n'
  result += '---\n\n'
  result +=
    'Brought to you by [ClearlyDefined](https://clearlydefined.io) and [tiny-attribution-builder](https://github.com/amzn/tiny-attribution-generator).\n\n'
  result +=
    '[:octocat: source](https://github.com/dabutvin/chive-action) | [🏷SPDX licenses](https://spdx.org/licenses/)] | [📘Best practices](https://www.nexb.com/blog/oss_attribution_obligations.html) | [ 👌Actions](https://github.com/features/actions)'
  return result

  function yesno(input) {
    return input ? '☑️' : '❌'
  }
}
