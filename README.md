<p>
    <h3 align="center"><code><span style="color: #72C834">npx</span> visualize-bundle</code></h3>
</p>
<p align="center">
<img src="https://github.com/JonnyBurger/npx-visualize-bundle/raw/master/npx-visualize-bundle.gif"/>
</p>
<p> </p>
<p> </p>



`npx visualize-bundle` allows you to inspect your React Native bundle in just one command and to diagnose big modules.

Just like on the web, you want to make your JavaScript file as small as possible. Whenever your app opens, the phone needs to parse the whole JavaScript bundle before it can run the React Native code. On lower-end phones, a big bundle can be a bottleneck on startup performance.

This package simply downloads the bundle and the sourcemap from the running packager and uses [source-map-explorer](https://github.com/danvk/source-map-explorer) to visualize it.

## Usage

No installation is needed, just type

```sh
npx visualize-bundle
```

into the command line. The `npx` command is available with npm 5.2 or later.

By default the iOS production bundle is being analyzed.
The following options are available:

```
-a, --android         analyse Android bundle 
-d, --dev             analyse developement bundle
-o, --output [dir]    output directory
-p, --port [port]     use custom port
-j, --json            save output as JSON file instead of HTML
-v, --version         print the version number
-h, --help            print usage information
```

## Development

Contributions are welcome - You can clone the repository and start the tool using `npm start`.

## License
MIT

---

<p align="center">
    <a href="https://twitter.com/JNYBGR">
        <img src="https://github.com/JonnyBurger/npx-visualize-bundle/raw/master/credit.png" height="28"/>
    </a>
</p>
