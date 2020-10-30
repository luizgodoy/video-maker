readline = require('readline-sync')

function inicio() {
    
    const content = {}

    content.searchTerm = solicitarTermoPesquisa() 
    content.prefix = solicitarPrefixoPesquisa()

    function solicitarTermoPesquisa () {
        return readline.question('Informe o termo a pesquisar: ')
    }

    function solicitarPrefixoPesquisa() {
        const prefixes = ['Quem é','O que é','A história', 'Porque']
        const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Escolha uma opção:')
        const selectedPrefixText = prefixes[selectedPrefixIndex]

        return selectedPrefixText;
    }

    console.log(content)
}

inicio()