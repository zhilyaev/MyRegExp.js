let R = ['{x}{y}', '{x|y}x']
const L = '!'
const specL = [L, '{', '}', '(', ')', '|']
let p = R.length
let R1 = R[0]
let R2 = R[1]

let M = L + R1.split('').join(L) + L
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
        // stateMap.set(+i+1, [index++])
        merge(+i+1, [index++])
        // console.log(`Установка состояния для ${M[i]}:`)
        // console.log(stateMap)
    }
}
console.log('\n\r')
// Основной цикл перебора
for (let i in M) {
    rule1(i)
    rule2(i)
    rule3(i)
    rule4(i)
}
console.log('Ответ:')
console.log(stateMap)
/*
* Индекс места перед любыми скобками распространяется
* на начальные места всех дизъюнктивных членов,
* записанных в этих скобках.
* */
function rule1 (i, states=[]) {
    let members = 0
    for (;i<M.length;i++) {
        if ('{' === M[i] || '(' === M[i]) {
            // i-1 Потому что берем слева
            rule1(+i+2, stateMap.get(+(i-1)))
        }
        else if ('|' === M[i]) members++
        else if ('}' === M[i] || ')' === M[i]) {
            // console.log(`Дощли до конца скобок [${i}]`)
            members = members > 0 ? members+1 : 0
            // console.log(`Сколько дизьюктивных членов мы нашли? => ${members}`)
            if (members > 0) {
                for (let j = i; j>=0; j--) {
                    if ('|' === M[j] || '{' === M[j] ||  '(' === M[j]) {
                        // console.log(`Нашли место [${+j+1}]`)
                        merge(+j+1, states)
                    }
                }
            } else console.warn('Данная скобка не является дизьюктивной')
            break
        }

    }
    // console.log(`Rule #1:`)
    // console.log(stateMap)
}

/*
* Индекс конечного места любого дизъюнктивного члена,
* заключенного в любые скобки,
* распространяется на место,
* непосредственно следующее за этими скобками.
* */
function rule2 (i, states=[]) {
    let mc = 0
    for (;i<M.length;i++) {
        if ('{' === M[i] || '(' === M[i]) {
            rule2(+i+1, states)
            break
        }
        else if ('|')
        else if ('}' === M[i] || ')' === M[i]){

        }
    }
}

/*
* Индекс места перед итерационными скобками распространяется на место,
* непосредственно следующее за этими скобками,
* а индекс места за итерационными скобками
* – на начальные места всех дизъюнктивных членов,
* заключенных в итерационные скобки.
* */
function rule3 (i, states=[]) {
    for (;i<M.length;i++) {
        if ('{' === M[i]) {
            // i-1 Потому что берем слева
            rule3(+i+1, stateMap.get(+(i-1)))
            break
        }
        else if ('}' === M[i]) {
            // Берем справа
            console.log('Rule #3')
            merge(+i+1, states)
            break
        }
    }
    //console.log(`Rule #3:`)
    //console.log(stateMap)
}

/*
* Индекс конечного места любого дизъюнктивного члена,
* заключенного в итерационные скобки,
* распространяется на начальные места всех дизъюнктивных членов,
* заключенных в эти итерационные скобки.
* */
function rule4 (i, states=[]) {
    let members = 0
    let Si = []
    for (;i<M.length;i++) {
        if ('{' === M[i]) {
            rule4(+i+2, stateMap.get(+(i+1)))
        }
        else if ('|' === M[i] || '}' === M[i]){
            members++
            if ('|' === M[i]) Si.push(+i+1)
            states.concat(stateMap.get(+(i-1)))
        }
    }

    console.log(`Кол-во членов ${members}`)
    console.log(`Индексы концов ${Si}`)
    console.log(`Насобирал ${states}`)
    for (let i in Si) {
        merge(i,states)
    }

    console.log(stateMap)
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