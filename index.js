const fs = require('fs')
const path = require('path')
const DocBuilder = require('tiny-attribution-generator/lib/docbuilder').default
const TextRenderer = require('tiny-attribution-generator/lib/outputs/text').default
const ClearlyDefinedSource = require('tiny-attribution-generator/lib/inputs/clearlydefined').default
const JsonRenderer = require('tiny-attribution-generator/lib/outputs/json').default
const PackageLockSource = require('tiny-attribution-generator/lib/inputs/packagelock').default
const request = require('superagent')

const jsonRenderer = new JsonRenderer()
const jsonBuilder = new DocBuilder(jsonRenderer)
const clearlyDefinedBuilder = new DocBuilder(new TextRenderer())

const packageData = fs.readFileSync(
  path.join(__dirname, './package-lock.json')
)

async function go() {

  const packageLockSource = new PackageLockSource(packageData.toString())
  await jsonBuilder.read(packageLockSource)
  const jsonOutput = await jsonBuilder.build()
  const clearlydefinedInput = {
    coordinates: jsonOutput.packages.map(
      x =>
      x.name.indexOf('/') > -1 ?
      `npm/npmjs/${x.name}/${x.version}` :
      `npm/npmjs/-/${x.name}/${x.version}`
    ),
  }
  await clearlyDefinedBuilder.read(new ClearlyDefinedSource(JSON.stringify(clearlydefinedInput)))
  const output = clearlyDefinedBuilder.build()

  // update notice file
  await request
  .put(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/contents/NOTICES`)
  .auth(process.env.GITHUB_TOKEN, {
    type: 'bearer'
  })
  .send({
    "message": "update NOTICES",
    "committer": {
      "name": "dabutvin",
      "email": "butvinik@outlook.com"
    },
    "content": Buffer.from(output).toString('base64')
  })

  // open PR
  await request
    .post(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls`)
    .auth(process.env.GITHUB_TOKEN, {
      type: 'bearer'
    })
    .send({
      "title": "NOTICE file updates",
      "body": "Please pull this in!",
      "head": "notice",
      "base": "master"
    })
}

go()
