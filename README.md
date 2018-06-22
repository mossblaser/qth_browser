Qth Browser
===========

A web based graphical browser for [Qth](https://github.com/mossblaser/qth).

This application is intended as a low-level tool rather than a general purpose
front end for home automation control. It provides a uniform, file-browser like
interface to Qth and allows you to browse, observe, set or send properties and
events.

Qth Browser has been designed to work primarily on mobile, touch screen
devices. This makes it well suited as a debugging tool for setting up sensors
and actuators around a house.

Compared with [the Qth command-line
interface](https://github.com/mossblaser/qth_cli), Qth Browser lacks some more
advanced functionality. For example, Qth Browser does cannot register new
properties or events, nor is its interface as efficient for an expert user to
navigate.

Build instructions
------------------

Qth Browser uses over 200 MB of trendy Javascript nonsense. As usual, download
it all with:

    $ npm install

Then use all that to make a staggeringly large Javascript file:

    $ npm run build

Then try out the whole glistening mass by running a test web server against the
`dist/` directory and visiting `http://localhost:8080/`.

    $ npm run serve

You'll need to have an MQTT broker which supports the MQTT WebSocket protocol.
[Mosquitto](https://mosquitto.org/) experimentally supports this feature but it
is disabled by default at compile time. As a result you'll probably need to
[compile and configure
Mosquitto](http://www.steves-internet-guide.com/mqtt-websockets/) by hand.
Finally, you must also be running a [Qth
Registrar](https://github.com/mossblaser/qth_registrar) otherwise Qth Browser
won't be very helpful.


Running the tests
-----------------

Qth Browser has a (fairly limited) test suite which you can run using:

    $ npm run test

The tests cover the back-end state management code (with moderately acceptable
coverage) but do not currently test the UI.


Getting around the code
-----------------------

Qth Browser uses [React](http://reactjs.org/) for its user interface and
[Redux](http://redux.js.org/) for storing its state.

A good place to start in Qth Browser's codebase is its Redux store, and in
particular its state tree. This tree holds (almost) all of the application's
state and gives a good indication of how the rest of the application fits
together. The state tree is split into two parts, defined below:

* [`src/store/qth/index.js`](./src/store/qth/index.js): The Qth state tree.
  Holds all of the information pulled from Qth, including connection states,
  directory listings and cached data.
* [`src/store/ui/index.js`](./src/store/ui/index.js): The UI state tree.
  Holds, for example, the path currently being displayed.

The associated actions are defined in neighbouring files and should also be
instructive.

From here you're on your own. The what the root of the application lacks in
comments is probably made up for by its typical verboseness. More exposition
can generally be found as you navigate deeper.

Finally, this is just an amateurish spare-time project and not intended as some
glorious real-world system. Don't expect too much, or indeed anything at all!
