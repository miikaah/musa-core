# EBUR128 Normalization addon

Dependencies

- libsndfile
- libebur128

## Install

Install N-API headers

```sh
npm install -g node-gyp
```

### VS Code (Windows)

Set the include path for your editor in .vscode/c_cpp_properties.json. Change Username and node-gyp version in the example config.

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

See `binding.gyp` for include and library directories

### MacOS

```sh
brew install libsndfile libebur128
```

### Windows

Create C:\C directory with `include` and `lib` subdirectories.

Copy `queue.h` header file to the `C:\C\include\` directory.

#### libsndfile

Download the libsndfile .lib and .h files from https://github.com/libsndfile/libsndfile/releases and place them in `C:\C\include\` and `C:\C\lib\`.

#### libebur128

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

Place the `ebur128.h` header file in `C:\C\include\` and the `ebur128.lib` file from the build/Release folder in `C:\C\lib\`.

## Build (root package.json)

```sh
npm run gyp:build
```
