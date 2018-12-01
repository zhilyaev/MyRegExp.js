class MyRegExp {
    // Расствляем палочки из Разметки РВ
    get markup () {
        return this.divider + this.regexp.split('').join(this.divider) + this.divider
    }
    // Индексы палочек
    get markupIndexes () {
        return this.markup
            .split('')
            .map((el, i) => (this.divider === el) ? i : false)
            .filter(el => false !== el)
    }
    // Алфавит
    get alphabet () {
        let r = []
        for (let v of this.regexp) {
            if (!this.escapes.includes(v) && !r.includes(v))
                r.push(v)
        }
        return r
    }
    // Множество финальных состояний
    get finals () {
        let r = []
        for (let i=0;i in this.nfa;i++){
            if (0 === Object.keys(this.nfa[i]).length) {
                r.push(i+'')
            }
        }
        return r
    }
    // Получить NFA из разметки
    get nfa () {
        let t = {}
        for (let i in this.markup) {
            if (!this.escapes.includes(this.markup[i])) {
                for (const from of this.map.get(+(i-1))) {
                    const to = this.map.get(+i+1)
                    const by  = this.markup[i]
                    //if (this.debug) console.log(`from ${from} by ${by} to ${to}`)
                    for (let y of to){
                        if (!(y in t)) {
                            t[y] = {}
                        }
                    }
                    let c = {}
                    // Todo Время 6 утра, я еле живой
                    try {
                        c[by] = merge_array(to, (t[from][by] || []))
                    } catch (e) {
                        c[by] = to
                    }
                    if (from in t) t[from] = Object.assign(t[from], c)
                    else t[from] = c
                }
            }
        }
        return t
    }
    // Получить DFA из NFA
    get dfa () {
        let query = [['0']]
        let dfa = {}
        let nfa = this.nfa
        console.log('NFA:')
        console.log(nfa)

        // state = [5, 3, 1]
        for (let dfaState of query) {
            // JS не позволит присваивать не объявленные поля
            if(!(dfaState in dfa)) {
                dfa[dfaState] = {}
            }
            console.log(`\tПросматриваемое новое состояние: ${dfaState}`)
            for (let a of this.alphabet) {
                console.log('\t\t~~~~~~~~~~~~~~~~~')
                console.log(`\t\tПо букве ${a}`)
                let U = [] // Массив обьединений
                console.log(`\t\tНачинаем обьединение`)
                for (let nfaState of dfaState) {
                    console.log(`\t\t\tПросматриваемое состояние ${nfaState} по ${a}`)
                    if (this.finals.includes(nfaState)) console.log(`\t\t\t\t ${nfaState} это финальное состояние у него нет переходов`)
                    if (!U.includes(nfa[nfaState][a]) && a in nfa[nfaState]){
                        U.push(nfa[nfaState][a])
                    }
                }
                console.log(`\t\tU = ${U}`)
                if (U.length>0){
                    dfa[dfaState][a] = `${U}`
                    let trueUnion = `${U}`.split(',')
                    if(!includes(query, trueUnion)){
                        query.push(trueUnion)
                    }
                }
            }
        }
        if (!this.debug) {
            console.log(`Очередь построения DFA:`)
            console.log(query)
            console.log(`DFA:`)
            console.log(dfa)
        }
        this.query = query
        return this.renameDFA(dfa)
    }

    constructor (regexp) {
        this.debug = false
        this.countRegexp = 1
        this.regexp = regexp
        if (Array.isArray(regexp)){
            this.countRegexp = regexp.length
            let r = '('
            for (let i in regexp) {
                r += (0 === +i) ? `(${regexp[i]})` : `|(${regexp[i]})`
            }
            r += ')'
            this.regexp = r
        }
        this.divider = '!'
        this.escapes = [this.divider, '{', '}', '(', ')', '|']
        this.map = new Map()
        this.buildBaseMap()
        this.circle()
        this.query = []
    }


    // Расстановка терминальных состояний
    buildBaseMap () {
        let index = 0
        this.map.set(this.markupIndexes[0], [index++])
        // Растановка базовых состояний (после символа)
        for (let i in this.markup){
            // markup[i] ∉ escapes => i ∈ Mi
            if (!this.escapes.includes(this.markup[i])) {
                if (this.debug) console.log(`\tУстановка состояния для ${this.markup[i]}:`)
                // i+1 Потому что ставим справа от символа
                this.fill(+i+1, [index++])
            }
        }
    }
    // Вспомогательная функция для слияния map
    fill (i, states=[]) {
        let a = this.map.get(i) || []
        let c = merge_array(a, states)
        if (this.debug) console.log(`\tДобавить в [${i}] => [${a} + ${states}]`)
        this.map.set(i, c)
        if (this.debug) console.log(this.map)
    }
    // Функция построения автоматной разметки
    circle () {
        let rule1 = []

        let rule2 = []
        let rule3 = []

        let rule4 = []
        let rule4To = []
        
        let M = this.markup
        for (let i in M) {
            i = parseInt(i)
            /*
            * Индекс места перед любыми скобками распространяется
            * на начальные места всех дизъюнктивных членов,
            * записанных в этих скобках.
            * */
            if ('(' === M[i] || '{' === M[i]) {
                rule1.push(this.map.get(+(i-1)) || [])
                this.fill(+i+1, rule1[rule1.length-1])
            }
            if ('|' === M[i] && rule1.length>0){
                this.fill(+i+1, rule1[rule1.length-1])
            }
            if ((')' === M[i] || '}' === M[i]) && rule1.length>0) {
                rule1.pop()
            }
            /*
            * Индекс конечного места любого дизъюнктивного члена,
            * заключенного в любые скобки,
            * распространяется на место,
            * непосредственно следующее за этими скобками.
            * */
            if ('(' === M[i] || '{' === M[i]) {
                rule2.push([])
            }
            if ('|' === M[i] && rule2.length>0){
                let c = merge_array(rule2.pop(), this.map.get(+(i-1)))
                rule2.push(c)
            }
            if ((')' === M[i] || '}' === M[i]) && rule2.length>0) {
                let c = merge_array(rule2.pop(), this.map.get(+(i-1)))
                if (this.debug) console.log('~~~~~~~~~~~~~\nRule 2')
                this.fill(+i+1, c)
            }
            /*
            * Индекс места перед итерационными скобками распространяется на место,
            * непосредственно следующее за этими скобками,
            * а индекс места за итерационными скобками
            * – на начальные места всех дизъюнктивных членов,
            * заключенных в итерационные скобки.
            * */
            if ('{' === M[i]) {
                rule3.push(this.map.get(+(i-1)))
            }
            if ('}' === M[i]) {
                if (this.debug) console.log('~~~~~~~~~~~~~\nRule 3')
                this.fill(+i+1, rule3.pop())
            }
            /*
            * Индекс конечного места любого дизъюнктивного члена,
            * заключенного в итерационные скобки,
            * распространяется на начальные места всех дизъюнктивных членов,
            * заключенных в эти итерационные скобки.
            * */
            if ('{' === M[i]) {
                rule4.push([])
                rule4To.push([+i+1])
            }
            if ('|' === M[i] && rule4.length>0) {
                let c = merge_array(rule4.pop(), this.map.get(+(i-1)))
                rule4.push(c)

                let p = rule4To.pop()
                p.push(+i+1)
                rule4To.push(p)
            }
            if ('}' === M[i]) {
                if (this.debug) console.log('~~~~~~~~~~~~~\nRule 4')
                let c = merge_array(rule4.pop(), this.map.get(+(i-1)))
                let p = rule4To.pop()
                for (let v of p) {
                    this.fill(v, c)
                }
            }
        }
    }
    // Функция проверки КНА
    test (input) {
        let state = '0'
        for (let a of input) {
            console.log(`${state} by ${a}`)
            state = this.dfa[state][a]
        }
        return state > 0
    }
    // Переименование DFA
    renameDFA (DFA) {
        let dfa = {}
        let namespace = new Map()
        for (let i in this.query) {
            dfa[i] = {}
            namespace.set(`${this.query[i]}`, i)
        }
        let i = 0
        for (let s of Object.keys(DFA)) {
            for (let a of Object.keys(DFA[s])){
                dfa[i][a] = namespace.get(DFA[s][a])
            }
            i++
        }
        console.log('Rename DFA:')
        console.log(dfa)
        return dfa
    }

}

let R = ['{x}{y}', '{x|y}x']
let r = new MyRegExp(R[0])
console.log(r.test('y'))


// TODO Мне лень написать это нормально, работает и ладно. Спасибо stackOverflow
function merge_array(array1, array2) {
    var result_array = [];
    var arr = array1.concat(array2);
    var len = arr.length;
    var assoc = {};

    while(len--) {
        var item = arr[len];

        if(!assoc[item])
        {
            result_array.unshift(item);
            assoc[item] = true;
        }
    }

    return result_array;
}
function includes(array, value) {
    let f = false
    for (let a of array) {
        if(arraysEqual(a, value)){
            f = true
            break
        }
    }
    return f
}
function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    // Please note that calling sort on an array will modify that array.
    // you might want to clone your array first.

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}