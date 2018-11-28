//  внизу часто используется унарный плюс
let R = ['{x}{y}', '{x|y}x']
const L = '!'
const specL = [L, '{', '}', '(', ')', '|']
let p = R.length
let R1 = R[0]
let R2 = R[1]
let RC = '({x}{y})|({x|y}x)'

let M = L + RC.split('').join(L) + L
let
    Mi = M
    .split('')
    .map((el, i) => (L === el) ? i : false)
    .filter(el => false !== el)

console.log('Строка с "палочками":')
console.log(M)

console.log('Индексы "Палочек":')
console.log(Mi)
const stateMap = new Map()


let index = 0
stateMap.set(Mi[0], [index++])
console.log(`Установка начального состояния:`)
console.log(stateMap)
// Растановка базовых состояний (после символа)
for (let i in M){
    // M[i] ∉ specL => i ∈ Mi
    if (!specL.includes(M[i])) {
        // i+1 Потому что ставим справа от символа
        console.log(`Установка состояния для ${M[i]}:`)
        merge(+i+1, [index++])
        // console.log(stateMap)
    }
}
console.log('\n\r')

circle()

function circle () {
    let rule1 = []
    let rule1Points = []

    let rule2 = []
    let rule3 = []

    let rule4 = []
    let rule4To = []

    for (let i in M) {
        /*
        * Индекс места перед любыми скобками распространяется
        * на начальные места всех дизъюнктивных членов,
        * записанных в этих скобках.
        * */
        if ('(' === M[i] || '{' === M[i]) {
            rule1.push(stateMap.get(+(i-1)))
            rule1Points.push(+i+1)
        }
        if ('|' === M[i] && rule1.length>0){
            rule1Points.push(+i+1)
        }
        if ((')' === M[i] || '}' === M[i]) && rule1Points.length>0) {
            let states = rule1.pop()
            for (let p of rule1Points){
                console.log('~~~~~~~~~~~~~\nRule 1')
                merge(p, states)
            }
            rule1Points = []
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
            let c = merge_array(rule2.pop(), stateMap.get(+(i-1)))
            rule2.push(c)
        }
        if ((')' === M[i] || '}' === M[i]) && rule2.length>0) {
            let c = merge_array(rule2.pop(), stateMap.get(+(i-1)))
            console.log('~~~~~~~~~~~~~\nRule 2')
            merge(+i+1, c)
        }
        /*
        * Индекс места перед итерационными скобками распространяется на место,
        * непосредственно следующее за этими скобками,
        * а индекс места за итерационными скобками
        * – на начальные места всех дизъюнктивных членов,
        * заключенных в итерационные скобки.
        * */
        if ('{' === M[i]) {
            rule3.push(stateMap.get(+(i-1)))
        }
        if ('}' === M[i]) {
            console.log('~~~~~~~~~~~~~\nRule 3')
            merge(+i+1, rule3.pop())
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
            let c = merge_array(rule4.pop(), stateMap.get(+(i-1)))
            rule4.push(c)

            let p = rule4To.pop()
            p.push(+i+1)
            rule4To.push(p)
        }
        if ('}' === M[i]) {
            console.log('~~~~~~~~~~~~~\nRule 4')
            let c = merge_array(rule4.pop(), stateMap.get(+(i-1)))
            let p = rule4To.pop()
            console.log(p)
            for (let v of p) {
                merge(v, c)
            }
        }

    }
}

function merge(i, states=[]) {
    // if (!Mi.includes(+i+1)) {
    //     console.error(`Индекс ${+i+1} не найден в Mi`)
    //     // break
    // }
    // || [] значит, что мы еще не нашли родительский индексы, нужно вернутся сюда позже

    let a = stateMap.get(i) || []
    let c = merge_array(a, states)
    console.log(`Добавить в [${i}] => [${a} + ${states}]`)
    stateMap.set(i, c)
    console.log(stateMap)
}

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