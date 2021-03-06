.. _addon:

.. index:: аддон

*****
Аддон
*****

.. _initialization_errors:

.. index:: аддон; ошибки инициализации

Ошибки инициализации
====================

Ошибки инициализации могут проявляться при инициализации аддона, либо при загрузке сцены в Blender.
При возникновении появится диалоговое окно с описанием ошибки.

.. image:: src_images/addon/init_error_message.jpg
   :align: center
   :width: 100%

|

+-------------------------------------+-------------------------------------------+
| Сообщение об ошибке                 | Причина                                   |
+=====================================+===========================================+
| Blend4Web initialization error!     | Ошибка загрузки аддона. Аддон не          |
| Addon is not compatible with        | совместим с платформой PLATFORM.          |
| the PLATFORM platform.              |                                           |
+-------------------------------------+-------------------------------------------+
| Warning: Blender version mismatch.  | Предупреждение о возможной                |
| Blender VER_REQUIRED is recommended | несовместимости с текущей версией Blender.|
| for the Blend4Web addon.            | Для работы рекомендуется версия Blender'а |
| Current version is VER_CURRENT.     | VER_REQUIRED. Текущая версия -            |
|                                     | VER_CURRENT.                              |
+-------------------------------------+-------------------------------------------+


.. index:: экспорт; ошибки

.. _export_errors:

Критические ошибки экспорта
===========================

При возникновении ошибок во время экспорта появляется диалоговое окно ``BLEND4WEB EXPORT ERROR`` с описанием проблемы:

    ``COMPONENT`` - тип компонента (объект, меш, материал, текстура и т.д.), при экспорте которого произошла ошибка.

    ``NAME`` - имя компонента.

    ``ERROR`` - краткое описание возникшей проблемы на англ. языке.

.. image:: src_images/addon/error_message.jpg
   :align: center
   :width: 100%

|

+-------------------------------------+-------------------------------------------+
| Сообщение об ошибке                 | Причина                                   |
+=====================================+===========================================+
| Dupli group error; Objects from     | Ни один из объектов группы GROUP_NAME,    |
| the GROUP_NAME dupli group on       | выбранной для дублирования на объекте     |
| the OBJECT_NAME object cannot be    | OBJECT_NAME, не экспортируется. Требуется |
| exported                            | разрешить экспорт хотя бы одного из       |
|                                     | объектов группы, либо убрать дублирование |
|                                     | группой.                                  |
+-------------------------------------+-------------------------------------------+
| Export to different disk is         | Не разрешен экспорт в директорию,         |
| forbidden                           | находящуюся на другом диске               |
+-------------------------------------+-------------------------------------------+
| Incompatible objects with           | Несовместимые объекты с общим мешем.      |
| a shared mesh; The OBJECT_NAME      | Не допускается экспорт объекта с общим    |
| object has both vertex groups and   | мешем и вертексными группами. Исключения: |
| a shared mesh                       | экспорт возможен, если                    |
|                                     | на объекте включены опции                 |
|                                     | ``Apply modifiers``,                      |
|                                     | ``Export vertex animation``,              |
|                                     | ``Export edited normals``,                |
|                                     | ``Apply scale``                           |
|                                     | (т.к. в этом случае при экспорте          |
|                                     | происходит полное копирование мешей).     |
+-------------------------------------+-------------------------------------------+
| Incomplete mesh; Material slot is   | Неполный меш: пустой слот материала.      |
| empty                               |                                           |
+-------------------------------------+-------------------------------------------+
| Incomplete vehicle. The NAME        | Моделируемое средство передвижения NAME   |
| vehicle doesn't have any chassis    | является незавершенным: оно должно        |
| or hull                             | содержать один элемент ``Chassis`` или    |
|                                     | ``Hull``.                                 |
+-------------------------------------+-------------------------------------------+
| Incomplete vehicle. The NAME        | Моделируемое средство передвижения NAME   |
| vehicle requires at least one bob   | является незавершенным: оно должно        |
|                                     | содержать хотя бы один элемент ``Bob``.   |
+-------------------------------------+-------------------------------------------+
| Incomplete vehicle. The NAME        | Моделируемое средство передвижения NAME   |
| vehicle requires at least one wheel | является незавершенным: оно должно        |
|                                     | содержать хотя бы один элемент ``wheel``. |
+-------------------------------------+-------------------------------------------+
| Incorrect mesh; Wrong group indices | Меш содержит вершины, привязанные к       |
|                                     | несуществующей группе.                    |
+-------------------------------------+-------------------------------------------+
| Incorrect vertex animation; Object  | Включен экспорт вертексной анимации для   |
| has no vertex animation             | объекта, но ни одной анимации не имеется. |
+-------------------------------------+-------------------------------------------+
| Incorrect vertex animation; Unbaked | Включен экспорт вертексной анимации для   |
| "ANIM_NAME" vertex animation        | меша, но анимация ANIM_NAME не содержит   |
|                                     | ни одного кадра.                          |
+-------------------------------------+-------------------------------------------+
| Loading of resources from different | Не разрешен экспорт ресурсов из           |
| disk is forbidden                   | директории, находящейся на другом диске.  |
+-------------------------------------+-------------------------------------------+
| The material has a normal map but   | Нодовый материал использует               |
| doesn't have any material nodes     | ``Normal Mapping``, но не имеет ноды      |
|                                     | ``Material``.                             |
+-------------------------------------+-------------------------------------------+
| The mesh has a UV map but has no    | Меш имеет текстурную развертку, но не     |
| exported material                   | имеет материала, который бы               |
|                                     | экспортировался.                          |
+-------------------------------------+-------------------------------------------+


+-------------------------------------+-------------------------------------------+
| The mesh has a vertex color layer   | Меш имеет слой вертексного цвета, но не   |
| but has no exported material        | имеет материала, который бы               |
|                                     | экспортировался.                          |
+-------------------------------------+-------------------------------------------+
| Missing lamp                        | На сцене должен быть хотя бы один         |
|                                     | источник света.                           |
+-------------------------------------+-------------------------------------------+
| No such file or directory           | Данная директория не существует.          |
+-------------------------------------+-------------------------------------------+
| Node material invalid; Check        | Ошибка нодового материала. Типы входа и   |
| sockets compatibility: FROM_NODE    | выхода связи между нодами ``FROM_NODE`` и |
| with TO_NODE                        | ``TO_NODE`` не соответствуют друг другу.  |
+-------------------------------------+-------------------------------------------+
| Object constraint has no target     | Для ограничителя объекта                  |
|                                     | (вкладка ``Object Constraints``)          |
|                                     | не установлено свойство                   |
|                                     | ``Target Object``.                        |
+-------------------------------------+-------------------------------------------+
| Particle system error; Dupli group  | Ошибка системы частиц. Не выбрана группа, |
| isn't specified                     | используемая в качестве частицы.          |
+-------------------------------------+-------------------------------------------+
| Particle system error; Dupli object | Ошибка системы частиц. Не выбран объект,  |
| isn't specified                     | используемый в качестве частицы.          |
+-------------------------------------+-------------------------------------------+
| Particle system error; Dupli object | Ошибка системы частиц. Объект             |
| OBJECT_NAME doesn't export          | OBJECT_NAME, выбранный в качестве         |
|                                     | частицы, не экспортируется (на нем        |
|                                     | выбрана опция ``Do not export``).         |
+-------------------------------------+-------------------------------------------+
| Particle system error; The          | Ошибка системы частиц. Ни один подходящий |
| GROUP_NAME dupli group contains no  | объект из группы GROUP_NAME, выбранной в  |
| valid object for export             | качестве частицы, не экспортируется.      |
|                                     | Либо на таких объектах выбрана опция      |
|                                     | ``Do not export``, либо объекты имеют     |
|                                     | неподходящий тип.                         |
|                                     | Поддерживаемые типы: ``MESH``.            |
+-------------------------------------+-------------------------------------------+
| Particle system error; Wrong dupli  | Ошибка системы частиц. В качестве частицы |
| object type TYPE_NAME               | выбран объект неподходящего типа.         |
|                                     | Поддерживаемые типы: ``MESH``.            |
+-------------------------------------+-------------------------------------------+
| Permission denied                   | Нет прав доступа к текущей директории.    |
+-------------------------------------+-------------------------------------------+
| Wrong edited normals count; It      | Число редактируемых нормалей не           |
| doesn't match with the mesh         | совпадает с числом вершин меша.           |
| vertices count                      | Требуется сделать ``Clean Up`` либо       |
|                                     | ``Save`` в панели                         |
|                                     | ``B4W Vertex Normals Editor``.            |
+-------------------------------------+-------------------------------------------+
| Wrong overridden bounding box;      | Указаны неверные размеры при              |
| Check the mesh's bounding box       | переопределении ``BoundingBox`` для меша: |
| values                              | минимальное значение больше максимального |
|                                     | для хотя бы одного из измерений.          |
+-------------------------------------+-------------------------------------------+
| Wrong vertex animation vertices     | Включен экспорт вертексной анимации, но   |
| count; It doesn't match with the    | число вершин покадрово в анимации         |
| mesh vertices count for "ANIM_NAME" | ANIM_NAME не совпадает с числом вершин    |
|                                     | меша. Возможное решение - "перезапекание" |
|                                     | анимации.                                 |
+-------------------------------------+-------------------------------------------+


.. _export_errors_warnings:

.. index:: экспорт; предупреждения об ошибках экспорта

Некритические ошибки экспорта
=============================

В отличие от критических ошибок экспорта, рассмотренных ранее, данные ошибки не препятствуют
экспорту, однако могут приводить к некорректному отображению сцен. Сообщения выводятся в консоли браузера (горячая клавиша ``F12``) при загрузке сцены. Сообщение (красного цвета) имеет вид:

    ``EXPORT ERROR: Сообщение об ошибке``

.. image:: src_images/addon/noncritical_messages.jpg
   :align: center
   :width: 100%

|

+-------------------------------------+-------------------------------------------+
| Сообщение об ошибке                 | Причина                                   |
+=====================================+===========================================+
| The NAME action has decimal frames. | Анимация NAME содержит дробные значения   |
| Converted to integer.               | кадров. Округлено до целых.               |
+-------------------------------------+-------------------------------------------+
| The NAME armature modifier has no   | В модификаторе NAME типа ``Armature`` не  |
| armature object or it is not        | указан объект, либо объект не             |
| exported. Modifier removed.         | экспортируется. Модификатор удален.       |
+-------------------------------------+-------------------------------------------+
| Canvas texture ID NAME already      | Данный идентификатор для объекта типа     |
| exists. Texture NAME.               | ``Canvas`` уже существует.                |
+-------------------------------------+-------------------------------------------+
| The NAME curve modifier has no curve| В модификаторе NAME типа ``Curve`` не     |
| object. Modifier removed.           | указан объект. Модификатор удален.        |
+-------------------------------------+-------------------------------------------+
| The NAME curve modifier has         | В модификаторе NAME типа ``Curve`` указан |
| unsupported curve object. Modifier  | неподходящий объект. Модификатор удален.  |
| removed.                            |                                           |
+-------------------------------------+-------------------------------------------+
| Empty canvas texture ID for texture | Пустое поле идентификатора для объекта    |
| NAME.                               | типа ``Canvas``.                          |
+-------------------------------------+-------------------------------------------+
| Exported UV-layer is missing in node| В ноде типа ``GEOMETRY`` указан не        |
| "GEOMETRY". Material: NAME.         | экспортируемый UV-слой для текстурных     |
|                                     | координат типа UV.                        |
+-------------------------------------+-------------------------------------------+
| Exported UV-layer is missing in     | В текстуре указан не экспортируемый       |
| texture NAME. [Material: NAME.]     | UV-слой для текстурных координат типа UV. |
+-------------------------------------+-------------------------------------------+

+-------------------------------------+-------------------------------------------+
| The NAME LAMP node has no lamp      | В ноде NAME типа ``LAMP`` не указан       |
| object. Material: NAME.             | подходящий объект.                        |
+-------------------------------------+-------------------------------------------+
| Ignoring LODs after empty LOD for   | В списке LOD объектов, настроенных для    |
| the NAME object.                    | объекта NAME, были проигнорированы все    |
|                                     | LOD объекты, следующие за пустым.         |
+-------------------------------------+-------------------------------------------+
| Incorrect NLA script, falling back  | Некорректный NLA-скрипт. Вместо него      |
| to simple sequential NLA.           | будет использоваться стандартная          |
|                                     | NLA-анимация.                             |
+-------------------------------------+-------------------------------------------+
| Incomplete mesh NAME; Dynamic grass | Неполный меш: специальный материал для    |
| vertex colors required              | ландшафта использует опции                |
| by material settings                | ``Dynamic grass size`` и/или              |
|                                     | ``Dynamic grass color``, но у меша нет    |
|                                     | слоев вертексного цвета с такими именами. |
+-------------------------------------+-------------------------------------------+
| Incomplete mesh; No UV in mesh      | Неполный меш: в материале меша            |
| with UV-textured material           | используются текстуры с типом координат   |
|                                     | ``UV``, но у меша нет текстурной          |
|                                     | развертки.                                |
+-------------------------------------+-------------------------------------------+
| Incomplete mesh; Material settings  | Неполный меш: материал меша имеет         |
| require vertex colors               | включенную опцию вертексного цвета        |
|                                     | (``Vertex Color Paint``), но у меша нет   |
|                                     | слоя вертексного цвета.                   |
+-------------------------------------+-------------------------------------------+
| No image in the NAME texture.       | У текстуры отсутствует изображение.       |
| [Material: NAME.]                   |                                           |
+-------------------------------------+-------------------------------------------+
| No texture in the texture slot.     | В текстурном слоте материала отсутствует  |
| Material: NAME.                     | текстура.                                 |
+-------------------------------------+-------------------------------------------+
| No texture in the NAME world        | В текстурном слоте объекта ``World``      |
| texture slot.                       | отсутствует текстура.                     |
+-------------------------------------+-------------------------------------------+
| No texture for the NAME particle    | В текстурном слоте системы частиц         |
| settings texture slot.              | отсутствует текстура.                     |
+-------------------------------------+-------------------------------------------+
| Only 2 UV textures are allowed for  | Движком поддерживаются только до 2 UV     |
| a mesh; The mesh has N UVs.         | текстур на каждый меш. Меш содержит UV    |
|                                     | текстуры в количестве N.                  |
+-------------------------------------+-------------------------------------------+
| Particle system error for \"NAME\"; | Ошибка системы частиц. Вертексный цвет    |
| The \"NAME\" vertex color specified | NAME указанный в поле ``to``, отсутствует |
| in the ``to`` field is missing in   | в объекте OBJECT_NAME, выбранном в        |
| the list of the \"OBJECT_NAME\"     | качестве частицы.                         |
| object's vertex colors              |                                           |
+-------------------------------------+-------------------------------------------+
| Particle system error for \"NAME\"; | Ошибка системы частиц. Вертексный цвет    |
| The \"NAME\" vertex color specified | NAME указанный в поле ``from``,           |
| in the ``from`` field is missing in | отсутствует в эмиттере OBJECT_NAME.       |
| the last of the \"OBJECT_NAME\"     |                                           |
| object's vertex colors              |                                           |
+-------------------------------------+-------------------------------------------+

+-------------------------------------+-------------------------------------------+
| Particle system error for \"NAME\"; | Ошибка системы частиц. Вертексный цвет    |
| The \"NAME\" vertex color specified | NAME указанный в поле ``to``, не          |
| in the "``to`` field is missing in  | присутствует в объекте OBJECT_NAME группы |
| the \"OBJECT_NAME\" object          | GROUP_NAME, выбранной в качестве частицы. |
| (\"GROUP_NAME\" dupli group)        |                                           |
+-------------------------------------+-------------------------------------------+
| The NAME armature modifier has a    | Модификатор арматуры имеет прокси объект  |
| proxy object as an armature.        | в качестве арматуры.                      |
| Modifier removed.                   |                                           |
+-------------------------------------+-------------------------------------------+
| The NAME node is not supported.     | Нода с данным именем не поддерживается    |
| The NAME material will be rendered  | движком, поэтому нодовый материал будет   |
| without nodes. Material: NAME.      | отключён. Чаще всего проблемы подобного   |
|                                     | рода возникают при использовании нод      |
|                                     | Cycles.                                   |
+-------------------------------------+-------------------------------------------+
| The NAME object has NAME armature   | Объект должен находиться в той же группе, |
| modifier which references the wrong | что и арматура или оба объекта должны явно|
| group. Modifier removed.            | присутствовать на сцене.                  |
+-------------------------------------+-------------------------------------------+
| Using "REFRACTION" node with        | Используется нодовый материал             |
| incorrect type of Alpha Blend.      | с неправильно заданным свойством Alpha    |
| Material: NAME.                     | Blend. Допускается значение               |
|                                     | ``Alpha sort``, ``Alpha blend`` и ``Add`` |
|                                     | при использовании ноды "REFRACTION".      |
+-------------------------------------+-------------------------------------------+
| Wrong texture coordinates type      | Для текстур с изображением (image)        |
| in texture NAME. [Material: NAME.]  | поддерживаются следующие типы координат:  |
|                                     | ``UV``, ``Normal`` и ``Generated``.       |
+-------------------------------------+-------------------------------------------+
| Wrong vertex color layer is used    | В ноде "GEOMETRY" используется неправильно|
| in node "GEOMETRY".                 | заданный вертексный слой.                 |
| [Material: NAME.]                   |                                           |
+-------------------------------------+-------------------------------------------+
| Wind bending: vertex colors weren't | Настройки процедурной анимации деревьев;  |
| properly assigned for \"NAME\".     | должны быть указаны названия всех слоев   |
| Properties were set to default      | вертексных цветов                         |
| values.                             | (``Main stiffness (A)``,                  |
|                                     | ``Leaves stiffness (R)``,                 |
|                                     | ``Leaves phase (G)``,                     |
|                                     | ``Overall stiffness (B)``),               |
|                                     | либо только главного                      |
|                                     | (``Main stiffness (A)``),                 |
|                                     | либо ни одного из них.                    |
+-------------------------------------+-------------------------------------------+
| Wind bending: not all               | Настройки процедурной анимации деревьев:  |
| vertex colors exist for \"NAME\".   | должны существовать все указанные         |
| Properties were set to default      | слои вертексных цветов.                   |
| values.                             |                                           |
+-------------------------------------+-------------------------------------------+
| Empty material slot in node         | Не задан материал в ноде: \"NAME\"        |
| \"NAME\". Material: \"NAME\".       |                                           |
+-------------------------------------+-------------------------------------------+


Прочие сообщения, требующие внимания пользователя
=================================================

Сообщения выводятся в консоли браузера (горячая клавиша ``F12``) при загрузке сцены. Сообщение (желтого цвета) имеет вид:

	``EXPORT WARNING: Сообщение экспорта, требующее внимания пользователя``

+-------------------------------------+-------------------------------------------+
| Сообщение об ошибке                 | Причина                                   |
+=====================================+===========================================+
| Missing active camera or wrong      | На сцене отсутствует активная камера      |
| active camera object                | (свойство ``Camera`` на вкладке           |
|                                     | ``Scene``).                               |
+-------------------------------------+-------------------------------------------+
| Missing world or wrong active world | На сцене должен быть хотя бы один мир.    |
| object                              |                                           |
+-------------------------------------+-------------------------------------------+
| The \"NAME\" camera has unsupported | Панорамная камера не поддерживается.      |                                    
| PANORAMIC type. Changed to          | Будет использована перспективная камера.  |
| PERSPECTIVE type."                  |                                           |
+-------------------------------------+-------------------------------------------+

.. _export_opts:

Опции экспорта
==============

*Autosave main file*
    Автосохранение файла, из которого осуществляется экспорт. **Включено по умолчанию**. Осуществляется непосредственно после экспорта с целью поддержки соответствия между текущим содержимым blend-файла и экспортного файла. Кроме того, для удобства в blend-файле сохраняется относительный путь к экспортному файлу.

.. image:: src_images/addon/save_mode.jpg
   :align: center
   :width: 100%

|

*Strict mode*
    Данный режим блокирует экспорт при наличии ошибок и сообщений, требующих внимания пользователя. Режим включается при выставлении опции ``Strict mode`` в меню экспорта:

.. image:: src_images/addon/strict_mode.jpg
   :align: center
   :width: 100%

|

    При наличии некритических ошибок экспорта или сообщений, требующих внимания пользователя, вашему вниманию будет представлено диалоговое окно вида:

.. image:: src_images/addon/messages.jpg
   :align: center
   :width: 100%

|

*Export converted media*
    Опция доступна при html-экспорте. Включение данного режима экспорта позволяет записать в HTML файл конвертированные медиафайлы разных форматов. Это необходимо использовать при создании кроссбраузерных и кроссплатформенных приложений при html-экспорте. При этом в html-файл будут записываться файлы, созданные с использованием :ref:`нашего конвертера <converter>`.

.. image:: src_images/addon/media_data.jpg
   :align: center
   :width: 100%

|

.. _run_in_viewer:

*Run in Viewer*
    Автоматически запустить просмотрщик сцен и добавить в него экспортируемую сцену. 

    При использовании :ref:`локального сервера разработки <local_development_server>`, имеется возможность открыть сцену, экспортированную в формате ``.json``, в просмотрщике сцен. Для этого при экспорте необходимо выбрать любой путь, лежащий внутри файловой структуры Blend4Web SDK. 
    
    В качестве директории для экспорта может использоваться созданная пользователем директория внутри Blend4Web SDK. При несоблюдении этого условия опция не будет отображаться в меню экспорта. Также опция не будет отображаться если локальный web-сервер не запущен.

.. image:: src_images/addon/run_in_viewer.png
   :align: center
   :width: 100%

|

