const fs = require('fs')
var contestSlug = ''          //<<<your contest slug goes here>>> 
var challengeIds = []         //<<<your challenge ids goes here>>>
var cookie = ''               //<<<your cookie goes here>>>
var x_csrf_token = ''         //<<<your x_csrf token goes here>>>
var userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
var codeBaseUrl = 'https://www.hackerrank.com/rest/contests/' + contestSlug + '/submissions/'
var submissionsBaseUrl = 'https://www.hackerrank.com/rest/contests/' + contestSlug + '/judge_submissions/?offset=0&limit=10000&challenge_id='
var options = {
    headers: {
        'X-CSRF-Token': x_csrf_token,
        'User-Agent': userAgent,
        'Cookie': cookie,
    }
};
var completed = 0
var operations = []
function writeFileSyncRecursive(filename, extention, content, charset) {
    var ext = 0
    if (fs.existsSync(filename + extention)) {
        ext++
        while (fs.existsSync(filename + `(${ext})` + extention)) ext++
    }
    if (ext == 0)
        filename += extention
    else
        filename += `(${ext})` + extention


    let filepath = filename.replace(/\\/g, '/');

    let root = '';
    if (filepath[0] === '/') {
        root = '/';
        filepath = filepath.slice(1);
    }
    else if (filepath[1] === ':') {
        root = filepath.slice(0, 3);
        filepath = filepath.slice(3);
    }

    const folders = filepath.split('/').slice(0, -1);
    folders.reduce(
        (acc, folder) => {
            const folderPath = acc + folder + '/';
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }
            return folderPath
        },
        root
    );

    fs.writeFileSync(root + filepath, content, charset);
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function extention(language) {
    switch (language) {
        case 'cpp':
        case 'cpp20':
        case 'cpp14':
            return '.cpp'
        case 'java8':
        case 'java15':
            return '.java'
        case 'c':
            return '.c'
        case 'python3':
            return '.py'
        case 'javascript':
            return '.js'
        case 'ada':
            return '.ada'
        default:
            return '.txt'
    }
}


(async function () {
    for (var challengeId of challengeIds) {
        console.log(challengeId)
        var res = await fetch(submissionsBaseUrl + challengeId, options)
            .catch(e => console.error(e))
        if (res.status == 200) {
            var body = await res.json()
            body.models.forEach(i => operations.push(i.id))
        }
    }
    for (var i = 0; i < operations.length; i++) {
        writeToFile(operations[i])
        if (i % 10 == 9) await delay(60000) //rate limit of hackerrank is 10/min
    }
})()

async function writeToFile(id) {
    var res = await fetch(codeBaseUrl + id, options)
        .catch(e => console.error(e))

    if (res.status == 200) {
        var body = await res.json()
        var code = body.model.code
        code += `\n\nid = ${id}\ncreated = ${body.model.created_at}`
        writeFileSyncRecursive('./' + contestSlug + '/' + body.model.slug + '/' + body.model.status + '/' + body.model.language + '/' + body.model.hacker_username, extention(body.model.language), code, 'utf-8')
        completed++
        console.log(completed + '/' + operations.length)
    }
    else {
        console.log(completed + '/' + operations.length)
        console.log('error in submission Id: ' + id)
        console.log('retrying in 60s')
        await delay(60000)

        writeToFile(id)
    }
}
