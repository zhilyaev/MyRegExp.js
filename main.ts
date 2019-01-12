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

function includes(array, value) {
  let f = false
  for (let a of array) {
    if (arraysEqual(a, value)) {
      f = true
      break
    }
  }
  return f
}


class MyRegExp {
  private readonly regExp: string
  debug: boolean = false
  private readonly separator: string = '!'
  private readonly escapes = [this.separator, '{', '}', '(', ')', '|']
  private map: Map<number, number[]> = new Map()
  private maxMapDeep: number = 0
  private readonly alphabet: string
  markup: string
  markupIndexes: number[]
  nfa: object
  dfa: object
  nfaFinals: number[] = []
  dfaFinals: string[] = []

  // Вспомогательная функция для поиска терминальных символов
  private uniq = (el: any, i: number, self: Array<any>) => {
    return !this.escapes.includes(el) && self.indexOf(el) === i
  }
  // Вспомогательная функция для слияния массивов без дубликатов
  private merge = (a, b) => {
    return a.concat(b).filter((el, i, a) => a.indexOf(el) === i)
  }
  // Вспомогательная функция для слияния map
  private fill = (i: number, states: number[]) => {
    let a = this.map.get(i) || []
    let m = this.merge(a, states)
    if (m.length > this.maxMapDeep) this.maxMapDeep = m.length
    this.map.set(i, m)
  }

  // Вспомогательная функция для отображения разметки
  printMarkup() {
    console.log('Программная разметка:')
    let s = '  '
    let M = this.markup.split('').map(el => el === '!' ? '\x1b[36m' + el + '\x1b[0m' : el
    ).join(s)
    console.log(M)

    for (let i = 0; i < this.maxMapDeep; i++) {
      let c = this.markupIndexes.map(index => (this.map.get(index)[i] >= 0) ? this.map.get(index)[i] + '' : '_').join(s + s + ' ')
      console.log(c)
    }
    console.log()
  }

  // Расстановка терминальных состояний
  private buildTerminalMap() {
    let M: string[] = this.markup.split('')
    let map: Map<number, number[]> = this.map
    // Установка начального состояния
    let index = 0
    map.set(0, [index++])
    // Растановка базовых состояний (после символа)
    M.forEach((el: string, i: number) => {
      if (!this.escapes.includes(M[i])) {
        // i+1 Потому что ставим справа от символа
        this.fill(i + 1, [index++])
      }
    })
  }


  // Расстановка терминальных состояний
  private buildAutomatonMap() {
    let M: string[] = this.markup.split('')
    let map: Map<number, number[]> = this.map


    let rule1 = []
    let rule2 = []
    let rule3 = []
    let rule4 = []
    let rule4To = []

    M.forEach((el: string, i: number) => {
      /*
            * Индекс места перед любыми скобками распространяется
            * на начальные места всех дизъюнктивных членов,
            * записанных в этих скобках.
      */
      if ('(' === M[i] || '{' === M[i]) {
        rule1.push(map.get(i - 1) || [])
        this.fill(i + 1, rule1[rule1.length - 1])
      }
      if ('|' === M[i] && rule1.length > 0) {
        this.fill(i + 1, rule1[rule1.length - 1])
      }
      if ((')' === M[i] || '}' === M[i]) && rule1.length > 0) {
        rule1.pop()
      }
      /*
            * Индекс конечного места любого дизъюнктивного члена,
            * заключенного в любые скобки,
            * распространяется на место,
            * непосредственно следующее за этими скобками.
      */
      if ('(' === M[i] || '{' === M[i]) {
        rule2.push([])
      }
      if ('|' === M[i] && rule2.length > 0) {
        let c = this.merge(rule2.pop(), map.get(i - 1))
        rule2.push(c)
      }
      if ((')' === M[i] || '}' === M[i]) && rule2.length > 0) {
        let c = this.merge(rule2.pop(), map.get(i - 1))
        if (this.debug) console.log('~~~~~~~~~~~~~\nRule 2')
        this.fill(i + 1, c)
      }
      /*
      * Индекс места перед итерационными скобками распространяется на место,
      * непосредственно следующее за этими скобками,
      * а индекс места за итерационными скобками
      * – на начальные места всех дизъюнктивных членов,
      * заключенных в итерационные скобки.
      * */
      if ('{' === M[i]) {
        rule3.push(map.get(i - 1))
      }
      if ('}' === M[i]) {
        if (this.debug) console.log('~~~~~~~~~~~~~\nRule 3')
        this.fill(i + 1, rule3.pop())
      }
      /*
      * Индекс конечного места любого дизъюнктивного члена,
      * заключенного в итерационные скобки,
      * распространяется на начальные места всех дизъюнктивных членов,
      * заключенных в эти итерационные скобки.
      * */
      if ('{' === M[i]) {
        rule4.push([])
        rule4To.push([i + 1])
      }
      if ('|' === M[i] && rule4.length > 0) {
        let c = this.merge(rule4.pop(), map.get(i - 1))
        rule4.push(c)

        let p = rule4To.pop()
        p.push(i + 1)
        rule4To.push(p)
      }
      if ('}' === M[i]) {
        if (this.debug) console.log('~~~~~~~~~~~~~\nRule 4')
        let c = this.merge(rule4.pop(), map.get(i - 1))
        let p = rule4To.pop()
        for (let v of p) {
          this.fill(v, c)
        }
      }
    })
  }

  // Получить NFA из разметки
  private buildNFA() {
    let M: string[] = this.markup.split('')
    let map: Map<number, number[]> = this.map
    let t = {}
    M.forEach((by: string, i: number) => {
      if (!this.escapes.includes(M[i])) {
        map.get(i - 1).forEach(from => {
          const to = map.get(i + 1)
          for (let y of to) {
            if (!(y in t)) {
              t[y] = {}
            }
          }
          let c = {}
          try {
            c[by] = this.merge(to, (t[from][by] || []))
          } catch (e) {
            c[by] = to
          }
          if (from in t) t[from] = Object.assign(t[from], c)
          else t[from] = c
        })
      }
    })
    return t
  }

  // Получить DFA из NFA
  private buildDFA(): object {
    let query = [['0']]
    let dfa = {}
    let nfa = this.nfa
    if (this.debug) console.log('NFA:')
    if (this.debug) console.log(nfa)

    // state = [5, 3, 1]
    for (let dfaState of query) {
      // JS не позволит присваивать не объявленные поля
      // @ts-ignore
      if (!(dfaState in dfa)) {
        dfa[dfaState + ''] = {}
      }
      if (this.debug) console.log(`\tПросматриваемое новое состояние: ${dfaState}`)
      for (let a of this.alphabet) {
        if (this.debug) console.log('\t\t~~~~~~~~~~~~~~~~~')
        if (this.debug) console.log(`\t\tПо букве ${a}`)
        let U = [] // Массив обьединений
        if (this.debug) console.log(`\t\tНачинаем обьединение`)
        for (let nfaState of dfaState) {
          if (this.debug) console.log(`\t\t\tПросматриваемое состояние ${nfaState} по ${a}`)
          if (this.nfaFinals.includes(+nfaState)) {
            if (this.debug) console.log(`\t\t\t\t ${nfaState} это финальное состояние у него нет переходов`)
            if (!this.dfaFinals.includes(`${dfaState}`)) {
              this.dfaFinals.push(`${dfaState}`)
            }
          }
          if (!U.includes(nfa[nfaState][a]) && a in nfa[nfaState]) {
            U.push(nfa[nfaState][a])
          }
        }
        if (this.debug) console.log(`\t\tU = ${U}`)
        if (U.length > 0) {
          dfa[dfaState + ''][a] = `${U}`
          let trueUnion = `${U}`.split(',')
          if (!includes(query, trueUnion)) {
            query.push(trueUnion)
          }
        }
      }
    }
    if (this.debug) {
      console.log(`Очередь построения DFA:`)
      console.log(query)
      console.log(`DFA:`)
      console.log(dfa)
      console.log(`DFA Финальные состояния:`)
      console.log(this.dfaFinals)
    }
    let rename = this.renameDFA(dfa, this.dfaFinals)
    this.dfaFinals = rename.finals
    return rename.dfa
  }

  // Переименование DFA
  renameDFA(DFA, finals) {
    let dfa = {}
    let dfaFins = []
    let namespace = new Map()
    let i = 0
    for (let s of Object.keys(DFA)) {
      dfa[i] = {}
      if (finals.includes(s) && !dfaFins.includes(i)) {
        dfaFins.push(i)
      }
      namespace.set(s, i)
      i++
    }
    if (this.debug) console.log(namespace)
    i = 0
    for (let s of Object.keys(DFA)) {
      for (let a of Object.keys(DFA[s])) {
        dfa[i][a] = namespace.get(DFA[s][a])
      }
      i++
    }

    return {
      dfa: dfa,
      finals: dfaFins
    }
  }

  // Тестирование DFA
  static testDFA(input: string, dfa: object, dfaFinals: number[]) {
    let s = 0
    for (let c of input.split('')) {
      s = dfa[s][c]
    }
    return dfaFinals.includes(s)
  }

  // Тестирование NFA
  static testNFA(input: string, nfa: object, nfaFinals: number[]) {
    // TODO
  }

  // main
  constructor(regExp: string, debug: boolean = false) {
    this.regExp = regExp
    this.debug = debug
    // Шаг 1.1: Установка разделителей
    this.markup =
      this.separator
      + this.regExp
        .split('')
        .join(this.separator)
      + this.separator

    this.alphabet = this.regExp
      .split('')
      .filter(this.uniq)
      .join('')

    this.markupIndexes = this.markup
      .split('')
      .map((el, i) => (this.separator === el) ? i : -1)
      .filter(el => -1 !== el)

    this.markupIndexes.forEach(index => this.map.set(index, []))

    // Шаг 1.2: Установка терминальных индексов
    this.buildTerminalMap()

    // Шаг 1.3: Установка подчинений
    this.buildAutomatonMap()

    // Шаг 2: Из получившейся разметки построить NFA
    this.nfa = this.buildNFA()
    this.nfaFinals = this.map.get(this.markupIndexes[this.markupIndexes.length - 1])

    // Шаг 3: Построить DFA по NFA
    this.dfa = this.buildDFA()
  }
}

let my = new MyRegExp('{xx}{yy}')
my.printMarkup()
console.log('NFA:', my.nfa)
console.log('NFA finals: ', my.nfaFinals)
console.log('DFA:', my.dfa)
console.log('DFA finals: ', my.dfaFinals)
