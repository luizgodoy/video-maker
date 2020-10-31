const robots = {
    input: require('./robots/input.js'),
    text: require('./robots/text.js'),
    state: require('./robots/state.js')
}

async function inicio() {

    robots.input()
    await robots.text()

    const content = robots.state.load()
    console.dir(content, { depth: null } )

    //console.log(JSON.stringify(content,null,4))
    //console.log(content)
}

inicio()