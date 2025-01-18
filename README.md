# NightZ.io TypeScript Server
This is the TypeScript game server from early prototype days of the multiplayer browser zombie survival game nightz.io.

I switched to using an Unity server right before release, and I don't quite remember why, but if I had to guess I wanted to use the same code in server and client and using C# for client/JS for server wasn't too easy. This was working, and probably even production-ready. Definitely better than the Unity server I ended up using.

Here's a few videos of me playing the prototype, using this game server.

- [YouTube: Speed Boost / Conveyor Belt](https://www.youtube.com/watch?v=4rdKHqaFpT8)
- [YouTube: Some zombie fighting and resource mining](https://www.youtube.com/watch?v=-6x9NwDttJI)

While it is impossible to run this server (`elsa` package was my custom server/matchmaker implementation, similar to Colyseus.js, but I no longer have it), I'm making this public for people who are curious about server-authoritative multiplayer game development.

There were no code examples (at least, ones that did not use existing libraries and wasn't C/C++) when I was learning this stuff, something like this could have helped me greatly, even if it isn't doing everything right. So if you're here, I hope this helps in some way.

## ⚠️ FOR REFERENCE ONLY.
***DO NOT THINK THIS REPO IS A PERFECT EXAMPLE, IT IS NOT DOING MOST THINGS RIGHT***

This was my second multiplayer game server, I didn't know many things, first one was even worse than this. I was beginning to learn game development. I like to learn stuff by doing, so there is a lot of things I made up or did wrong here. This is a very old project that was never used in production.
**This is by no means perfect, and I would do pretty much everything differently today**, so this is not a "good" example, but it is an example nevertheless. FYI, this is not actually ECS, but things are named Entity/Component/System, so it is confusing.

## Implemented stuff
> ⚠️ Just because I say implemented **does not mean they're complete or correct**. I did not check all of this. Reference at your own risk.

### Features
- Area of Interest / Interest Management
- Character Movement
- Basic Inventory
- Equipment
- Levels
- Teams
- Dying / Respawning
- Spawning zombies / resources with a max spawn limit
- AI Behaviour Trees
  - This is probably the most correctly implemented feature here, as far as I can remember. Don't quote me on that, though.
- Zombie AI
- Turret AI
- Placing objects (Building mechanic)
- Resources: Gold, Wood, Stone, Food
- Health
- Things that damage you on touch, such as spikes
- Bows / Projectiles
- Healing by eating food
- Healing out of combat
- .io Game item upgrade tree
- Rewarding players on entity kill
- Items
	- Melee weapon
	- Bow
	- Consumables / Food
	- Shield
- Text chat
- Server leaderboard
- Minimap
- Name tags
- Entities that decay when their owner leaves
- Zones? They're basically just colored rectangles in a map. Mostly client-side, server just tells which parts are colored what.

### Entities
- Player Character
- Zombie
- Mines/Resources
  - Food
  - Wood
  - Stone
  - Gold
- Walls (Wood,Stone,Reinforced)
- Spikes / Walls that damage nearby entities (Wood,Stone,Reinforced)
- Turrets (Wood,Stone,Reinforced)
- Automatic miners (Wood,Stone,Reinforced)
- Speed Boost / Conveyor Belt
- Repair pad that heals nearby allied structures
