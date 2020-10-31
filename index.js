const readline = require('readline-sync')
const robots = {
    //userInput: require('./robots/user-input.js')
    text: require('./robots/text.js')
}

async function inicio() {
    
    const content = {
        maximumSentences: 7
    }

    content.searchTerm = solicitarTermoPesquisa() 
    content.prefix = solicitarPrefixoPesquisa()
    
    //userInput.userInput(content)
    await robots.text(content)

    function solicitarTermoPesquisa () {
        return readline.question('Informe o termo a pesquisar: ')
    }

    function solicitarPrefixoPesquisa() {
        const prefixes = ['Quem é','O que é','A história', 'Porque','Como', 'Qual é', 'Passo a passo para']
        const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Escolha uma opcao:')
        const selectedPrefixText = prefixes[selectedPrefixIndex]

        return selectedPrefixText;
    }
    //console.log(content)
    console.log(JSON.stringify(content,null,4))
}

inicio()