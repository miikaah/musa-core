{
  "targets": [
    {
      "sources": ["binding.cpp", "normalization.c"],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "<(module_root_dir)/../include"
      ],
      "library_dirs": [
        "<(module_root_dir)/../lib"
      ],
      "libraries": [
        "-lsndfile",
        "-lebur128",
      ],
      "conditions": [
        ['OS=="mac"', {
          "target_name": "normalization-v1.0.0-darwin-arm64",
        }],
        ['OS=="win"', {
          "target_name": "normalization-v1.0.0-win-x64",
        }],
        ['OS=="linux"', {
          "target_name": "normalization-v1.0.0-linux-x64",
        }]
      ]
    }
  ]
}