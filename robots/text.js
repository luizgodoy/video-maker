const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

async function robot(content) {
    await buscarConteudoWikipedia(content)
    refinarConteudo(content)
    dividirConteudoEmSentencas(content)

    async function buscarConteudoWikipedia(content) {
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo("web/WikipediaParser/0.1.2?timeout=60") 
        const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
        const wikipediaContent = wikipediaResponse.get()
        
        content.sourceContentOriginal = wikipediaContent.content
    }

    function refinarConteudo (content){
        const withoutBlankLines = removerLinhasBranco(content.sourceContentOriginal)
        const withoutMarkdown = removerMarcadores(withoutBlankLines)
        const withoutDatesInParentheses = removerDatasEntreParenteses(withoutMarkdown)
        
        content.sourceContentSanitized = withoutDatesInParentheses

        function removerLinhasBranco(text) {
            const allLines = text.split('\n')

            const withoutBlankLines = allLines.filter((line) => {
                if (line.trim().length === 0) {
                    return false
                }
                return true
            })
            return withoutBlankLines    
        }

        function removerMarcadores(text) {
            const withoutMarkdown = text.filter((line)=> {
                if(line.trim().startsWith('=')) {
                    return false
                }
                return true
            })
            return withoutMarkdown
        }

        function removerDatasEntreParenteses(text) {
            return text.toString().replace(/(\s\(.*?\))|<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi,'').replace(/  /g,' ')
        }        
    }

    function dividirConteudoEmSentencas(content) {
        content.sentences = []
        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)

        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })
    }
}

module.exports = robot