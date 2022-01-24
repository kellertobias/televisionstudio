const CSSParser = require('css');
const fs = require('fs');
const path = require('path');
const {URL}  = require('url');
const downloadFile = require("async-get-file");

function mkdirP(inputPath) {
    if (fs.existsSync(inputPath)) {
      return;
    }
    const basePath = path.dirname(inputPath);
    if (fs.existsSync(basePath)) {
      fs.mkdirSync(inputPath);
    }
    mkdirP(basePath);
  }

const loadFonts = () => {
    const fontsCSS = fs.readFileSync('./client/fonts.css', {encoding: 'utf-8'})
    const ast = CSSParser.parse(fontsCSS);
    const rules = ((ast.stylesheet || {}).rules || [])
    const fontFileDownloads = []
    rules.forEach((rule) => {
        if(rule.type !== 'font-face') return
        (rule.declarations || []).forEach((declaration) => {
            if(declaration.type !== 'declaration') return
            if(declaration.property !== 'src') return
            let value = declaration.value || 'url() type(woff2)'
            let [opener, ...second] = value.split('(')
            let [urlString, ...closer] = second.join('(').split(')')
            const url = new URL(urlString)
            fontFileDownloads.push(url)
            declaration.value = `${opener}('/fonts${url.pathname}')${closer.join(')')}`
        })
    })

    const downloadQueue = []
    fontFileDownloads.forEach((url) => {
        const fontDir = url.pathname.substring(0, url.pathname.lastIndexOf("/"));
        const filename = url.pathname.split('/').pop();
        const directory = `./client/fonts${fontDir}`
        if (!fs.existsSync(directory)){
            mkdirP(directory);
        }
        if(!fs.existsSync(`${directory}/${filename}`)) {
            downloadQueue.push(
                downloadFile(url.href,{directory, filename}).then(() => {
                    console.log(`Loaded ${url.href}`)
                    return Promise.resolve(true)
                })
            )
        } else {
            downloadQueue.push(Promise.resolve(false))
        }
    })

    Promise.all(downloadQueue).then((answers) => {
        var downloaded = (answers.filter((x) => x)).length
        console.log(`Donloaded ${downloaded} / ${answers.length} Fonts`)
    })

    const css = CSSParser.stringify(ast)

    return "/* Generated CSS */\n" + css
}

module.exports = loadFonts

if (require.main === module) {
    fontsCss = loadFonts()
} else {
    console.log('required as a module');
}