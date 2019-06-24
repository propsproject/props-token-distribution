[![NPM version](https://badge.fury.io/js/mocha-osx-reporter.svg)](http://badge.fury.io/js/mocha-osx-reporter)

# mocha-osx-reporter

`mocha-osx-reporter` is a reporter for [mocha](https://github.com/visionmedia/mocha) that displays test results in the 
OSX Notification Center). It only works for node.js at the moment.

## Usage

    npm install mocha-osx-reporter --save-dev
    mocha --reporter mocha-osx-reporter

If you want to use another reporter to display the outputs to the console, you can use [mocha-multi](https://github.com/glenjamin/mocha-multi).

    multi="mocha-osx-reporter=- spec=-" mocha --reporter mocha-multi

## Contributions

Please open issues for bugs and suggestions in [github](https://github.com/jtblin/mocha-osx-reporter/issues).

## Author

Jerome Touffe-Blin, [@jtblin](https://twitter.com/jtlbin), [About me](http://about.me/jtblin)

## License

mocha-osx-reporter is copyright 2014 Jerome Touffe-Blin and contributors. It is licensed under the BSD license. 
See the include LICENSE file for details.
