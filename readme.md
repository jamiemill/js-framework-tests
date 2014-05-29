Goal: decide the best way to structure an app with multiple pages and a navbar


possible strategies

- everything flows down from router, when a menu item is clicked, the route is triggered and whole page redrawn
- as above but re-drawing is more intelligent so not the whole screen is redrawn
- clicking a menu item doesn't trigger a route but instead the screen changes and the URL is updated with the new state


features in descending order of priority

- top level object like a master view
- persistent main menu with different items highlighted
- two screens to switch between
- logged in and out states (with menu appearing/disappearing?)
- subviews


versions to try

- no-frills backbons.js
- marionnete.js
- some of the patterns we have evolved at TIM Group (event bus, handlers)
