{
  "targets": [
    {
      "target_name": "normalization-v1.0.0-darwin-arm64",
      "sources": ["binding.cpp", "normalization.c"],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "/opt/homebrew/include/"
      ],
      "libraries": [
        "-lsndfile",
        "-lebur128"
      ],
      "library_dirs": [
        "/opt/homebrew/Cellar/libsndfile/1.2.2/lib",
        "/opt/homebrew/Cellar/libebur128/1.2.6/lib"
      ],
    }
  ]
}