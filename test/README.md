# fusion.gl tests

## Run tests
```shell
mocha
```

## Install ##

### Mocha
```shell
npm install --global mocha
```

### windows-build-tools
```shell
npm install --global --production windows-build-tools
```

Add `path-to-python` to system enviroment path.

### GTK 2

You will need the [cairo](http://cairographics.org) library which is bundled in GTK. Download the GTK 2 bundle for [Win32](http://ftp.gnome.org/pub/GNOME/binaries/win32/gtk+/2.24/gtk+-bundle_2.24.10-20120208_win32.zip) or [Win64](http://ftp.gnome.org/pub/GNOME/binaries/win64/gtk+/2.22/gtk+-bundle_2.22.1-20101229_win64.zip). Unzip the contents in `C:\GTK`.

*Notes:*

- Both GTK and Node.js need either be 64bit or 32bit to compile successfully.
- Download GTK 2, _**not GTK 3**_, which is missing the required libpng. If you get linker errors you've most likely picked the wrong bundle.
- If you use a different location than `C:\GTK`, add a `GTK_Root` argument to `npm install` or `node-gyp rebuild`. For example: `node-gyp rebuild --GTK_Root=C:\somewhere\GTK`.

### Install devDependencies

```shell
npm install
```

## Generate Test Fixtures

```shell
cd ./test/fixtures
node generate.js
```

Images will be generated in `./test/common/fixtures/expected`

Generation snippets are in `./test/common/fixtures/snippets`
