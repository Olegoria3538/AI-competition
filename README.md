# AI-competition
A test competition the idea of which is to write a character control script is arranged in terms of "Game artificial intelligence". [The application](http://f0798392.xsph.ru/) hosting the competition is inspired by the Bomberman game. Participants are to develop a character behavior model that could create a competitive pursuit for other players.  
  
A character can:  
- Move in one of 4 directions: up, right, down, left  
- Plant a bomb that explodes after time expires and destroys walls and other players  
- Skip a turn  
  
All AI scripts must meet the following requirements:  
- Valid JavaScript script  
- Zero infinite loops, recursions in the script  
- The bot must be able to plant a bomb and aim to defeat other players  
  
Rules and conditions:  
- Deathmatch mode  
- The winner of the game session is a person who is the last one alive  
- The winner of the competition is a person who wins the game session three times  
- Maps are selected in numerical order; if cards need to be repeated, the game continues from the first map  
- If the map is provided for more players than the number of participants, the remaining places are filled with bots with random behavior  
  
The competition uses well-known maps, which can be found by following path `./src/maps`, and were sent to the participants of the competition in advance.  
  
AI scripts of the players are located in the following path `./src/ai-scripts`. The scripts are written in JavaScript.  
  
The originating [code for the application is here.](https://github.com/gershuk/AiBattle-V2.0)

---

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

