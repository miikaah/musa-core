#include "normalization.c"
#include <napi.h>

Napi::Value CalcLoudnessWrapper(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || !info[0].IsArray()) {
    Napi::TypeError::New(env, "Array of string arguments expected")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Array jsArray = info[0].As<Napi::Array>();
  int argc = jsArray.Length();

  std::vector<std::string> argStrings;
  std::vector<const char*> argv;

  for (int i = 0; i < argc; ++i) {
    Napi::Value jsValue = jsArray[i];
    if (!jsValue.IsString()) {
      Napi::TypeError::New(env, "All elements in the array must be strings")
          .ThrowAsJavaScriptException();
      return env.Null();
    }
    argStrings.push_back(jsValue.As<Napi::String>().Utf8Value());
    argv.push_back(argStrings.back().c_str());
  }

  int result = calc_loudness(argc, argv.data());

  return Napi::Number::New(env, result);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "calc_loudness"),
              Napi::Function::New(env, CalcLoudnessWrapper));
  return exports;
}

NODE_API_MODULE(binding, Init)