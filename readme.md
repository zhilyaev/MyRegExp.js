# Построения DFA по регулярному выражение
>  Программная реализация работы простого парсера регулярок
Поддерживаються конструкции РВ: конткатенация, `{}` - итерация, `()` группировка и `|` конструкиция `или` 

### Алгоритм синтеза
1. Разметка регулярного выражения
    1. Установка разделителей
        * `|(|0|1|v|1|0|)|`
    2. Установка терминальных индексов
        * Помечаем справа от терминального символа
    3. Установка подчинений 4 правила
        1. Индекс места перед любыми скобками распространяется
           на начальные места всех дизъюнктивных членов,
           записанных в этих скобках.
        2. Индекс конечного места любого дизъюнктивного члена,
           заключенного в любые скобки,
           распространяется на место,
           непосредственно следующее за этими скобками.
        3. Индекс места перед итерационными скобками распространяется на место,
           непосредственно следующее за этими скобками,
           а индекс места за итерационными скобками
           – на начальные места всех дизъюнктивных членов,
           заключенных в итерационные скобки.
        4. Индекс конечного места любого дизъюнктивного члена,
           заключенного в итерационные скобки,
           распространяется на начальные места всех дизъюнктивных членов,
           заключенных в эти итерационные скобки.
       
2.  Из получившейся разметки построть NFA
    * Из каких индексов по какому терминальному символу мы можем перейти в индексы
    
3. Построить DFA по NFA
    1. Установка начального состояния `query = [ [ 0 ] ]`
    2. Установка `DFA = []`
    3. Установка множества конечных состояний для DFA `dfaFinals = []`
    4. Цикл по `query`:
        1. `dfaState = query[i]`
        2. Цикл по Алфавиту терминальных символов:
            1. `a = A[j]`
            2. Установка множества `U = []`
            3. Цикл по `dfaState`:
                1. `nfaState = dfaState`
                2. `if nfaState ∈ nfaFinals AND nfaState ∉ dfaFinals then dfaFinals += dfaState`
                3. `if NFA[nfaState][a] ∉ U then U += NFA[nfaState][a]`
            4. `if U ∉ Ø`:
                1. `DFA[dfaState][a] = U`
                2. `if U ∉ query then query += U`

4. Переименовать DFA