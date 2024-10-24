# EBUR128 Normalization addon

Dependencies

- libsndfile
- libebur128

## Install

Install N-API headers

```sh
npm install -g node-gyp
```

### VS Code (Linux)

File .vscode/c_cpp_properties.json.

```json
{
  "configurations": [
    {
      "name": "Linux",
      "includePath": [
        "${workspaceFolder}/**",
        "${workspaceFolder}/node_modules/node-addon-api",
        "${HOME}/.nvm/versions/node/v22.4.1/include/node"
      ],
      "defines": [],
      "cStandard": "c17",
      "cppStandard": "gnu++17",
      "intelliSenseMode": "linux-gcc-x64"
    }
  ],
  "version": 4
}
```

### VS Code (Windows)

File .vscode/c_cpp_properties.json. Change Username and node-gyp version in the example config.

```json
{
  "configurations": [
    {
      "name": "Win32",
      "includePath": [
        "${workspaceFolder}/**",
        "C:\\Users\\<Username>\\AppData\\Local\\node-gyp\\Cache\\22.3.0\\include\\node"
      ],
      "defines": ["_DEBUG", "UNICODE", "_UNICODE"],
      "windowsSdkVersion": "10.0.19041.0",
      "compilerPath": "cl.exe",
      "cStandard": "c17",
      "cppStandard": "c++17",
      "intelliSenseMode": "windows-msvc-x64"
    }
  ],
  "version": 4
}
```

### VS Code (MacOS)

File .vscode/c_cpp_properties.json.

```json
{
  "configurations": [
    {
      "name": "Mac",
      "includePath": [
        "${workspaceFolder}/**",
        "${workspaceFolder}/node_modules/node-addon-api",
        "${HOME}/.nvm/versions/node/v22.3.0/include/node"
      ],
      "defines": [],
      "macFrameworkPath": [
        "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/System/Library/Frameworks"
      ],
      "compilerPath": "/usr/bin/clang",
      "cStandard": "c17",
      "cppStandard": "c++17",
      "intelliSenseMode": "macos-clang-arm64"
    }
  ],
  "version": 4
}
```

See `binding.gyp` for include and library directories

### MacOS

```sh
brew install libsndfile libebur128
```

### Windows

The built binary and external binaries are included in the repo.

You can update the external binaries manually.

#### Update libsndfile

Download libsndfile from https://github.com/libsndfile/libsndfile/releases and place the `sndfile.h` in `addons/include` and `sndfile.dll` & `sndfile.lib` files in `addons/lib`.

#### Update libebur128

Clone the https://github.com/jiixyj/libebur128 and build the library with CMake.

Create `build` folder and

```sh
cd build
```

Create the build files

```sh
cmake -DCMAKE_BUILD_TYPE=Release ..
```

Build the release version

```sh
cmake --build . --config Release
```

Place the `ebur128.h` header file in `addons/include` and the `ebur128.lib` & `ebur128.dll` files from the build/Release folder in `addons/lib`.

## Build (root package.json)

```sh
npm run gyp:build
```
