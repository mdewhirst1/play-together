#Play Together
This is a tool for helping steam friends find common games they can play together,without having to go through your entire library and working out what has multiplayer and if everyone else owns it

##Set up guide

For this app to be able to get peoples steam games it requires everyone's profile to be set to public, otherwise the steam api will not return any info.

In order to be able to use this app you will require a steam api key inorder to allow the app to make requests to the steam api. It can be acquired from here https://steamcommunity.com/dev/ 

Once you have an api key run, copy key-test.json and place your steam key in the appropriate place.

Install the dependencies with:

```
yarn install
```

We try to cache info retrieved from the steam API, and we use sqlite for this. To setup the database, run:

```
yarn run sql
```

That's it you are now set up and ready to start using play together, have fun!

To execute the application, use:

```
yarn run gogo <steamId> <steamId>... 
```

##How to use guide

todo
needs commands

###How to get a steam id

First check the user's profile on steam

if it is in this format https://steamcommunity.com/profiles/1100011

then the number on the end of the profile is that persons steam id

If however the profile url is this format https://steamcommunity.com/id/coolname

then you need to use this url http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=your-key&vanityurl=coolname

(substitute coolname for the name you want, and the key for your dev key) and then search for steamid in the response.
