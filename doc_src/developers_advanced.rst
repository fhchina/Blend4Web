.. _developers_advanced:

********************
Разработчикам движка
********************


.. _coding_style:

Стиль оформления кода
=====================

В движке применяется структурное программирование. Код организуется в модули. Подходы ООП не используются, классы не определяются, наследование не осуществляется и т.п. 

Используется `K&R стиль <http://en.wikipedia.org/wiki/1_true_brace_style#K.26R_style>`_, за исключением того, что открывающая скобка для составного оператора ставится на той же строке, например:

.. code-block:: javascript

    function foo_bar() {
        // ...
    }

    if (a > b) {
        // ...
    } 

Для выравнивания используются 4 пробела (табуляция запрещена).

Примеры
-------

В именах переменных и функций используется знак подчеркивания:

.. code-block:: javascript

    var foo_bar = 123;  // correct
    var fooBar = 123;   // wrong
    
Все глобальные переменные начинаются со знака подчеркивания:

.. code-block:: javascript

    var _foo_bar = null;

Константы пишутся прописными буквами и никогда не начинаются со знака подчеркивания:

.. code-block:: javascript

    var FOO_BAR = 100;

Для внешних API названия методов и свойств задаются через точку.
Поля, требующие защиту от обфускации, помещаются в специальный тэг ``@cc_externs``:

.. code-block:: javascript

    exports.FOO_BAR = 123;

    exports.foo_bar = function() {
        
    }

    /**
     * Set properties.
     * @method module:properties.set_props
     * @param {Object} foo Foo object
     * @cc_externs props_1 props_2
     * @cc_externs props_3 props_4
     */
    exports.set_props = function(foo) {

        var bar_1 = foo.props_1;
        var bar_2 = foo.props_2;
        var bar_3 = foo.props_3;
        var bar_4 = foo.props_4;

        ...
    }
 
Комментарии только на английском языке. Стиль комментирования - JSDoc.


Сборка движка
=============

Перед сборкой необходимо убедиться, что в системе присутствуют все необходимые
зависимости, для чего следует свериться с :ref:`таблицей <dependencies>`.

Для компиляции движка и входящих в SDK приложений достаточно выполнить команду
из корневой директории SDK:

.. code-block:: bash

    make compile

Полная сборка, включающая конвертацию ресурсов (текстур, звуков и видео),
компиляцию и подготовку документации вызывается командой:

.. code-block:: bash

    make build

Сборка архивов с дистрибутивами:

.. code-block:: bash

    make dist

Все вышеперечисленные операции могут быть выполнены одной командой:

.. code-block:: bash

    make all

Сборка аддона
=============

Бинарные сборки аддона Blend4Web подготовлены для следующих платформ: Linux x32/64, OS X x64, Windows x32/64.
В то же время пользователи имеют возможность произвести сборку самостоятельно. 

Для этого необходимо наличие Python 3.x (желательно, чтобы версия была эквивалентна используемой в Blender) и компилятора языка C (в Linux достаточно установить пакеты python3-dev и build-essential).

Пути относительно корня репозитория:
    - скрипт сборки: ``csrc/b4w_bin/build.py``
    - аддон Blend4Web: ``blender_scripts/addons/blend4web/``

Запуск сборки осуществляется следующим образом:

.. code-block:: bash
    
    python3 ./csrc/b4w_bin/build.py

Результатом сборки будет бинарный файл с именем:

``b4w_bin_[ПЛАТФОРМА]_[АРХИТЕКТУРА].[СТАНДАРТНОЕ_РАСШИРЕНИЕ]``,

размещенный в каталоге с аддоном. Пример: ``b4w_bin_Linux_64.so``. После этого аддон станет готовым к использованию на данной платформе.



.. _dependencies:

Зависимости
===========

Для ведения эффективной разработки движка и приложений, необходим ряд сторонних
программ (зависимостей). Большинство этих зависимостей находится в составе
современных дистрибутивов GNU/Linux, таких как Ubuntu. В других Unix-подобных
системах (Apple OS X, FreeBSD) их установка из исходных кодов или иных
источников не представляет существенных проблем.

В таблице ниже перечислены все зависимости, в порядке убывания важности для
разработки.

+-------------------------------+-------------------------------+----------------------------+
| Название                      | Пакет в дистрибутиве Ubuntu   | Назначение                 |
|                               | 14.04                         |                            |
+===============================+===============================+============================+
| Bash                          | в составе по умолчанию        | интерпретатор скриптов     |
+-------------------------------+-------------------------------+----------------------------+
| Python 3                      | в составе по умолчанию        | интерпретатор скриптов     |
+-------------------------------+-------------------------------+----------------------------+
| NodeJS                        | nodejs                        | компиляция шейдеров        |
+-------------------------------+-------------------------------+----------------------------+
| Java                          | default-jre                   | компиляция и обфускация    |
|                               |                               | модулей движка             |
+-------------------------------+-------------------------------+----------------------------+
| Emscripten                    | из исходных текстов           | сборка Uranium             |
+-------------------------------+-------------------------------+----------------------------+
| LLVM, Clang                   | из исходных текстов           | сборка Uranium             |
+-------------------------------+-------------------------------+----------------------------+
| ImageMagick, GraphicsMagick   | imagemagick, graphicsmagick   | конвертация ресурсов       |
+-------------------------------+-------------------------------+----------------------------+
| NVIDIA Texture Tools          | libnvtt-bin                   | конвертация ресурсов       |
+-------------------------------+-------------------------------+----------------------------+
| NVIDIA Cg Toolkit             | nvidia-cg-toolkit             | отладка шейдеров           |
+-------------------------------+-------------------------------+----------------------------+
| Libav                         | libav-tools                   | конвертация ресурсов       |
+-------------------------------+-------------------------------+----------------------------+
| Gnuplot                       | gnuplot                       | отладка                    |
+-------------------------------+-------------------------------+----------------------------+
| Graphviz                      | graphviz                      | отладка                    |
+-------------------------------+-------------------------------+----------------------------+
| xsel                          | xsel                          | отладка                    |
+-------------------------------+-------------------------------+----------------------------+
| Sphinx                        | sphinx-doc                    | сборка документации        |
|                               |                               | (HTML-версия)              |
+-------------------------------+-------------------------------+----------------------------+
| sphinx-intl                   | устанавливается с помощью PIP | сборка документации        |
|                               |                               | (перевод)                  |
+-------------------------------+-------------------------------+----------------------------+
| TeX Live                      | texlive, texlive-latex-extra  | сборка документации        |
|                               | texlive-lang-cyrillic         | (PDF-версия)               |
+-------------------------------+-------------------------------+----------------------------+
| JSDoc 3                       | из исходных текстов           | сборка документации        |
|                               |                               | (документация на API)      |
+-------------------------------+-------------------------------+----------------------------+



Названия функций и переменных
=============================

Рекомендуется при создании новых функций и переменных использовать следующие префиксы и суффиксы.

*init_*
    создание абстрактного объекта

*create_*
    создание конкретного объекта

*update_*
    обновить состояние имеющегося объекта

*attach_/detach_*
    добавить/удалить временное свойство к объекту

*append_/remove_*
    добавить/удалить временное свойство к уже существующим подобного рода

*insert_/pop_*
    добавить/удалить элемент массива (доступ по индексу места)

*apply_/clear_*
    операция с флагом, бинарной величиной или произвольным параметром

*set_/get_*
    установить/получить значение свойства/переменной

*_tmp*
    глобальная переменная - кеш в виде простого объекта (массив, вектор)

*_cache*
    глобальная переменная - кеш в виде сложного объекта



.. _debugging:

Отладка
=======

Отладка движка производится с помощью методов модуля ``debug.js``.

Структура текущего рендер-графа может быть сохранена в формате DOT с помощью
вызова ``b4w.debug.scenegraph_to_dot()``, например, в консоли браузера. После
вызова данного метода содержимое консоли сохранить в файл с расширением .gv. Чтобы получить граф
в графическом виде, необходим набор утилит `graphviz <http://www.graphviz.org/>`_.
Преобразование в формат SVG выполняется с помощью вызова:

.. code-block:: bash

    > dot -Tsvg graph.gv -o graph.svg

где ``graph.gv`` имя файла с сохранённым графом.

.. _shaders:

Шейдеры
=======

.. index:: обфускатор шейдеров

Обфускатор
----------

Используемые в движке шейдеры подвергаются обработке обфускатором. 
Для запуска обфускации требуется выполнить одну из команд в корне репозитория:

* **make** *compile_shaders* - проверка, обфускация и экспорт скомпилированных шейдеров
* **make** *verify_shaders* - только проверка и обфускация

Обфускатор служит для сокращения объема, оптимизации и затруднения понимания 
GLSL-кода. На данный момент в нем реализованы следующие процедуры:

* удаление лишних пробелов, переводов строк и повторяющихся символов ";"
* замена пользовательских идентификаторов более короткими односимвольными, двухсимвольными и т.д. именами
* вывод сообщений о неиспользуемых переменных и функциях (dead code)
* проверка синтаксиса шейдеров
* поддержка import/export-механизма и проверка шейдеров на соответствие ему

В процессе обфускации сначала осуществляется синтаксический анализ (парсинг) 
текста шейдера. Соответствующий парсер создается автоматически на основе грамматики с помощью генератора `PEG.js <http://pegjs.majda.cz/>`_. Далее по данным парсинга производится оптимизация и валидация шейдеров, после чего шейдеры экспортируются в виде абстрактного синтаксического дерева (Abstract Syntax Tree, AST) для непосредственной загрузки движком.

Расположение основных файлов в репозитории:

* исходная грамматика - glsl_utils/pegjs/glsl_parser.pegjs
* скрипт генерации парсера - glsl_utils/pegjs/gen_nodejs.sh
* парсер - glsl_utils/compiler/glsl_parser.js

.. index:: обфускатор шейдеров; директивы import/export

Директивы import/export
-----------------------

В целях упорядочивания, структурирования и повышения удобочитаемости кода шейдеров в include-файлах используются директивы import и export.
Они указываются в начале файла и должны выглядеть примерно следующим образом:

.. code-block:: glsl

    #import u_frame_factor u_quatsb u_quatsa u_transb u_transa a_influence 
    #import qrot

    #export skin

Директива ``#import`` определяет набор идентификаторов, которые объявлены вне этого include-файла, но доступны для использования в нем. Имеется ограничение: такие идентификаторы должны быть обязательно объявлены где-либо выше места подключения include-файла.

Директива ``#export`` определяет набор идентификаторов, доступных для использования вне данного файла. Такие идентификаторы должны быть обязательно объявлены в этом файле.

Таким образом, шейдер, использующий include-файл, обязан до места подключения содержать объявления, необходимые для импорта, а после него может использовать экспортируемые идентификаторы.

Идентификаторами могут быть как имена переменных, так и имена функций. По умолчанию при отсутствии директив import/export считается, что include-файл не использует внешние объявления и не предоставляет пользование внутренними.

.. index:: обфускатор шейдеров; ограничения

Рекомендации и ограничения по использованию обфускатора
-------------------------------------------------------

В связи с наличием препроцессинга, необходимостью совместной обработки нескольких шейдеров и include-файлов, а также особенностями реализации обфускатора гарантировать работоспособность полученного на выходе кода можно только при соблюдении ряда правил или ограничений на текст исходных шейдеров:

1. Обязательное использование специальной директивы ``#var`` для описания констант, определяемых движком в момент запуска. Например:

.. code-block:: glsl

    #var AU_QUALIFIER uniform
    AU_QUALIFIER float a;

Синтаксис здесь схож с директивой #define. Смысл директивы #var в том, чтобы определяемое ею значение позволило распарсить исходный шейдер. Что это будет конкретно (например, 'uniform' или 'attribute' в примере выше), не важно, т.к. на этом этапе оно все равно неизвестно. Однако, желательно указывать более-менее подходящее описание, а не что-то совершенно произвольное.

.. note::

    Для констант, используемых не в коде шейдера, а в выражениях препроцессинга, директива ``#var`` не обязательна.

2. Использование при необходимости директив import/export.
3. Не следует перегружать встроенные функции, только пользовательские.
4. Не следует объявлять переменные с именем одной из встроенных функций, либо main (даже если это не приводит к ошибке).
5. Нельзя использовать директивы #var и #define для замены отдельных символов в таких операторах, как: "++", "--", "\*=", "/=", "+=", "-=", "==", "<=", ">=", "!=", "&&", "||", "^^".

Например:

.. code-block:: glsl

    #var EQUAL =
    ...
    a *EQUAL b;
    ...

6. Использование директивы #include, не должно приводить к неоднозначности при обфускации содержимого include-файла. Это может произойти в том случае, когда один и тот же файл включается в несколько разных шейдеров, и в каком-то из них могут повлиять определенные выше директивы, вроде #var или #define. Также не стоит использовать в include-файле необъявленные функции и переменные.

7. Использование вложенных include'ов или множественного включения одного и того же include'a в один и тот же шейдер не поддерживается.
8. К неработоспособности шейдера может привести нетривиальное использование препроцессинга, например, создающее невалидный GLSL-код:

.. code-block:: glsl

    #if TYPE
    void function1() {
    #else
    void function1(int i) {
    #endif
        ...
    }
    
9. Не следует объявлять переменные с именами вида ``node_[NODE_NAME]_var_[IN_OUT_NODE]``, где ``NODE_NAME`` --- название некоторой ноды, ``IN_OUT_NODE`` --- название одного из входов или выходов ноды.

.. index:: WebGL; расширения

Поддержка WebGL-расширений
--------------------------

Работа обфускатора может зависеть от используемых WebGL-расширений, если они каким-либо образом влияют на шейдерный язык.
На данный момент поддерживаются следующие расширения:

    * OES_standard_derivatives

.. index:: обфускатор шейдеров; ошибки

Ошибки обфускатора
------------------

В случае ошибки обфускатор выведет соответствующее сообщение в консоли.

Перечень возможных ошибок:

+-------------------------------------+-------------------------------------------+
| Сообщение об ошибке                 | Причина                                   |
+=====================================+===========================================+
| Error! Ambiguous obfuscation in     | Ошибка! Неоднозначная обфускация          |
| include file 'FILE_NAME'.           | include-файла FILE_NAME.                  |
+-------------------------------------+-------------------------------------------+
| Error! Bad preprocessing collision  | Ошибка в файле FILE_NAME. Невозможность   |
| while obfuscation identifier:       | обфускации переменной с именем NAME из-за |
| \'NAME'. Varying/uniform or         | переопределения при препроцессинге.       |
| varying/attribute qualifiers        | Переопределение одной и той же переменной |
| combination. File: 'FILE_NAME'.     | с разными квалификаторами. Недопустимые   |
|                                     | комбинации: varying/uniform,              |
|                                     | varying/attribute.                        |
+-------------------------------------+-------------------------------------------+
| Error! Extension NAME is            | Ошибка! WebGL-расширение с именем NAME,   |
| unsupported in obfuscator. File:    | использованное в файле FILE_NAME, не      |
| 'FILE_NAME'.                        | поддерживается обфускатором.              |
+-------------------------------------+-------------------------------------------+
| Error! Include 'FILE_NAME' not      | Ошибка! При подключении не найден         |
| found.                              | include-файл FILE_NAME.                   |
+-------------------------------------+-------------------------------------------+
| Error! Undeclared TYPE: 'NAME'.     | Ошибка в файле FILE_NAME. Необъявленный   |
| File: 'FILE_NAME'.                  | идентификатор типа TYPE (переменная,      |
|                                     | функция, структура, ...) с именем NAME.   |
+-------------------------------------+-------------------------------------------+
| Error! Undeclared TYPE: 'NAME'.     | Ошибка! Необъявленный идентификатор типа  |
| Importing data missed. File:        | TYPE (переменная, функция, структура, ... |
| 'FILE_NAME'.                        | ) с именем NAME. Отсутствует объявление   |
|                                     | идентификатора, требуемого в              |
|                                     | include-файле FILE_NAME согласно          |
|                                     | директиве ``#import``.                    |
+-------------------------------------+-------------------------------------------+
| Error! Undeclared TYPE: 'NAME'.     | Ошибка в файле FILE_NAME. Необъявленный   |
| Possibly exporting needed in        | идентификатор типа TYPE (переменная,      |
| include file 'INCLUDE_NAME'. File:  | функция, структура, ...) с именем NAME.   |
| 'FILE_NAME'.                        | Возможно требуется разрешить его экспорт  |
|                                     | в include-файле INCLUDE_NAME.             |
+-------------------------------------+-------------------------------------------+
| Error! Undeclared TYPE: 'NAME'.     | Ошибка! Необъявленный идентификатор типа  |
| Possibly importing needed. File:    | TYPE (переменная, функция, структура, ... |
| 'FILE_NAME'.                        | ) с именем NAME. Возможно требуется       |
|                                     | указать его как импортируемый в           |
|                                     | include-файле FILE_NAME.                  |
+-------------------------------------+-------------------------------------------+
| Error! Unused export token 'NAME'   | Ошибка! В include-файле FILE_NAME         |
| in include file 'FILE_NAME'.        | разрешен для экспорта необъявленный       |
|                                     | идентификатор с именем NAME.              |
+-------------------------------------+-------------------------------------------+

+-------------------------------------+-------------------------------------------+
| Error! Using reserved word in TYPE  | Ошибка в файле FILE_NAME. Использование   |
| 'NAME'. File: 'FILE_NAME'.          | зарезервированного слова при объявлении   |
|                                     | идентификатора типа TYPE (переменная,     |
|                                     | функция, структура, ...) с именем NAME.   |
+-------------------------------------+-------------------------------------------+
| Error! 'all' extension cannot have  | Ошибка! Директива ``#extension``,         |
| BEHAVIOR_TYPE behavior. File:       | указанная для всех (``all``)              |
| 'FILE_NAME'.                        | WebGL-расширений в файле FILE_NAME, не    |
|                                     | поддерживает поведение BEHAVIOR_TYPE.     |
+-------------------------------------+-------------------------------------------+
| Syntax Error. ERROR_MESSAGE. File:  | Ошибка синтаксиса в строке LINE_NUMBER,   |
| FILE_NAME, line: LINE_NUMBER,       | столбце COL_NUMBER при парсинге шейдера   |
| column: COL_NUMBER.                 | FILE_NAME. Исходное описание ошибки       |
|                                     | приведено в ERROR_MESSAGE. В сообщении    |
|                                     | прилагается листинг кода в окрестности    |
|                                     | соответствующей строки (следует           |
|                                     | учитывать особенность pegjs-парсеров,     |
|                                     | указывающих чуть далее места, вызвавшего  |
|                                     | ошибку).                                  |
+-------------------------------------+-------------------------------------------+
| Warning! Function 'NAME' is         | В файле FILE_NAME объявлена функция NAME, |
| declared in [include ]file          | которая нигде не используется.            |
| FILE_NAME, but never used.          |                                           |
+-------------------------------------+-------------------------------------------+
| Warning! Include file 'FILE_NAME'   | Include-файл FILE_NAME не используется ни |
| not used in any shader, would be    | в одном из шейдеров, поэтому будет        |
| omitted!                            | исключен из закомпиленной версии.         |
+-------------------------------------+-------------------------------------------+
| Warning! Unused import token 'NAME' | Идентификатор с именем NAME импортируется |
| in include file 'FILE_NAME'.        | в include-файле FILE_NAME, но нигде не    |
|                                     | используется.                             |
+-------------------------------------+-------------------------------------------+
| Warning! Variable 'NAME' is         | В файле FILE_NAME объявлена переменная    |
| declared in include file            | NAME, которая нигде не используется.      |
| FILE_NAME, but never used.          |                                           |
+-------------------------------------+-------------------------------------------+

    
