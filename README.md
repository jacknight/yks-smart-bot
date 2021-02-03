# YKS Smart Bot

A combination of my existing [Buzzerd](https://github.com/jacknight/buzzer) bot and some Your Kickstarter Sucks discord server commands.

## Commands
### Buzzer
| Command       | Argument    | Description                                        | Needs buzzer role?              |
|---------------|-------------|----------------------------------------------------|---------------------------------|
| !buzz.role    | @role       | Change the role that controls the buzzer           | Yes, or MANAGE_ROLES permission |
| !buzz.channel | #channel    | Change the channel the bot listens to for buzz-ins | Yes                             |
| !buzz.nick    | "nick name" | Change the nickname of the bot                     | Yes                             |
| !buzz.mode    |             | Toggle the mode to/from normal/chaos               | Yes                             |
| !buzz.ready   |             | Enable/disable the buzzer                          | Yes                             |
| !buzz.list    |             | See who has buzzed in so far                       | Yes                             |
| !buzz.random  |             | Randomize the list of people who have buzzed in    | Yes                             |
| !buzz.clear   |             | Clear the list of people who have buzzed in        | Yes                             |
| !heep         |             | Buzz in!                                           | No                              |

### Listen Together
| Command        | Argument       | Description                |
|----------------|----------------|----------------------------|
| !listen play   |                | Play latest episode/resume |
| !listen play   | episode number | Play given episode number  |
| !listen random |                | Play a random episode      |
| !listen pause  |                | Pause                      |
| !listen stop   |                | Stop                       |


### Miscellaneous
| Command  | Argument       | Description                                                                       |
|----------|----------------|-----------------------------------------------------------------------------------|
| !best    | episode number | Vote on your favorite ever episode. One vote per member, but it can be changed    |
| !latest  |                | Get titles and links to the latest episodes from both the main and patreon feeds. |
| !welcome |                | Toggle guild member welcome message.
