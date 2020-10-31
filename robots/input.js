const readline = require('readline-sync')
const state = require('./state.js')

function robot() {
    const content = {
        maximumSentences: 7
    }

    content.searchTerm = solicitarTermoPesquisa() 
    content.prefix = solicitarPrefixoPesquisa()
    state.save(content)
    
    function solicitarTermoPesquisa () {
        return readline.question('Informe o termo a pesquisar: ')
    }

    function solicitarPrefixoPesquisa() {
        const prefixes = ['Quem é','O que é','A história', 'Porque','Como', 'Qual é', 'Passo a passo para']
        const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Escolha uma opcao:')
        const selectedPrefixText = prefixes[selectedPrefixIndex]

        return selectedPrefixText;
    }
}

module.exports = robot