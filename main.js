class FSA {
    constructor (Q=[], A=[], D=[], Qs=0, Qf=[]) {
        this.Q = Q
        this.A = A
        this.D = D
        this.Qs = Qs
        this.Qf = Qf
    }

    toString () {
        let r = [
            "Тип КНА: " + this.constructor.name,
            "Множество состояний: " + this.Q,
            "Алфавит: " + this.A,
            "Функции переходов (обычный): " + this.D,
            "Функции переходов (ключ-знач): " + this.closure,
            "Начальное состояние: " + this.Qs,
            "Финальные состояния: " + this.Qf
        ]
        return r.join('\n')
    }
}
class NFA extends FSA {

}
class DFA extends FSA {
}

function nfa2dfa (dfa, nfa) {
    dfa.A = nfa.A
    dfa.Qs = nfa.Qs

}

class MyRegExp {
    constructor (regexp) {
        this.regexp = regexp
        this.divider = '!'
        this.escapes = [this.divider, '{', '}', '(', ')', '|']
        this.map = new Map()
        this.debug = false
        this.buildBaseMap()
        this.circle()
        this.nfa2dfa()
    }
    buildBaseMap () {
        let index = 0
        this.map.set(this.markupIndexes[0], [index++])
        // Растановка базовых состояний (после символа)
        for (let i in this.markup){
            // markup[i] ∉ escapes => i ∈ Mi
            if (!this.escapes.includes(this.markup[i])) {
                if (this.debug) console.log(`Установка состояния для ${this.markup[i]}:`)
                // i+1 Потому что ставим справа от символа
                this.fill(+i+1, [index++])
            }
        }
    }
    fill (i, states=[]) {
        let a = this.map.get(i) || []
        let c = merge_array(a, states)
        if (this.debug) console.log(`Добавить в [${i}] => [${a} + ${states}]`)
        this.map.set(i, c)
        if (this.debug) console.log(this.map)
    }
    get markup () {
        return this.divider + this.regexp.split('').join(this.divider) + this.divider
    }
    get markupIndexes () {
       return this.markup
        .split('')
        .map((el, i) => (this.divider === el) ? i : false)
        .filter(el => false !== el)
    }
    get alphabet () {
        let r = []
        for (let v of this.regexp) {
            if (!this.escapes.includes(v) && !r.includes(v))
                r.push(v)
        }
        return r
    }
    get finals () {
        let r = []
        for (let i=0;i in this.table;i++){
            if (0 === Object.keys(this.table[i]).length) {
                r.push(i)
            }
        }
        return r
    }
    get table () {
        let t = {}
        for (let i in this.markup) {
            if (!this.escapes.includes(this.markup[i])) {
                for (const from of this.map.get(+(i-1))) {
                    const to = this.map.get(+i+1)
                    const by  = this.markup[i]
                    if (this.debug) console.log(`from ${from} by ${by} to ${to}`)
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

    test (input='') {
        let state = 0
        for (let a of input) {
            state = this.table[state][a]
        }
        return state === Object.keys(this.table).length-1
    }

    nfa2dfa () {
        let query = [[0]]
        let dfa = []
        let nfa = this.table
        console.log(nfa)
        console.log(Array.from(nfa))

        for (let state of query) {
            for (let s of state) {
                if (!nfa[s]){
                    console.warn(`Нет состояния ${s}`)
                    break
                }
                for (let a of this.alphabet){
                    if (!nfa[s][a]){
                        console.warn(`Нет перехода по ${a} из ${s}`)
                        break
                    }

                    let destinations = []
                    let finals = []
                    for (let ns of nfa[s][a]) {
                        if (!destinations.includes(ns)){
                            destinations.push(ns)
                        }
                    }

                    if (0===destinations.length) {
                        finals.push(null)
                    } else {
                        for (let d of destinations)
                            for (let v of d)
                                if (!finals.includes(v))
                                    finals.push(v)
                    }

                    dfa[s][this.alphabet.indexOf(a)] = finals

                    if(!includes(query, nfa[s][a])){
                        query.push(nfa[s][a])
                    }

                }
            }
        }
    }

}

let R = ['{x}{y}', '{x|y}x']
let RC = '(({x}{y})|({x|y}x))'
let r = new MyRegExp(RC)
// let fsa = new FSA()
// console.log(fsa.toString())

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