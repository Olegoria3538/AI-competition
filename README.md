# AI-competition
В рамках предмета "Игровой искусственный интеллект", проводится тестовое соревнование по написанию скрипта управления игровым персонажем. 
[Приложение](http://f0798392.xsph.ru/), в котором проводится соревнование, вдохновлено игрой bomberman.
Участникам необходимо разработать модель поведения персонажа, которая могла бы создать конкуренцию другим игрокам. 

Персонаж обладает следующими возможностями:
 - Ход в одну из 4 сторон: вверх, вправо, вниз, влево
 - Ставить бомбу, которая взрывается по истечению времени, уничтожая стены и других игроков
 - Пропустить ход

Скрипты "ИИ" должны отвечать следующим требованиям:

 - Валидный JavaScript скрипт
 - Отсутствие бесконечных циклов, рекурсий в скрипте
 - Бот должен уметь ставить бомбу и стремиться к победе над другими игроками

Правила соревнований:

 - Режим deathmatch
 - Победителем игровой сессии считается тот, кто остался последним в живых
 - Победителем соревнований считается тот, кто выиграл в игровой сессии три раза
 - Карты выбираются по порядку, и если требуется повторение карт, игра продолжается с первой
 - Если карта предусмотрена на большее количество игроков, чем количество участников,  оставшиеся места заполняются ботами с рандомным поведением

Соревнования проводятся по известным картам, которые находятся по следующему пути `./src/maps`, и были высланы участникам соревнований заранее.

Скрипты "ИИ" игроков находятся по следующему пути `./src/ai-scripts`. Скрипты написаны на языке JavaScript.

Исходный код приложения [находится тут.](https://github.com/gershuk/AiBattle-V2.0)
