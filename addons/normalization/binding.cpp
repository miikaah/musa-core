#include "normalization.c"
#include <napi.h>

Napi::Object CalcLoudnessResultToJsObject(const Napi::Env& env,
                                          const calc_loudness_result& result) {
  Napi::Object obj = Napi::Object::New(env);
  obj.Set("filepath", Napi::String::New(env, result.filepath));
  obj.Set("gain", Napi::Number::New(env, result.gain));

  Napi::Array blockList = Napi::Array::New(env, result.block_list_size);
  for (size_t i = 0; i < result.block_list_size; ++i) {
    blockList.Set(i, Napi::Number::New(env, result.block_list[i]));
  }
  obj.Set("block_list", blockList);

  return obj;
}

Napi::Value CalcLoudnessWrapper(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
    return env.Null();
  }
  std::string filepath = info[0].As<Napi::String>();

  struct calc_loudness_result result = calc_loudness(filepath.c_str());
  return CalcLoudnessResultToJsObject(env, result);
}

Napi::Value CalcLoudnessAlbumWrapper(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // Check if the correct number of arguments are passed
  if (info.Length() != 1) {
    Napi::TypeError::New(env, "Expected one argument")
        .ThrowAsJavaScriptException();
    return Napi::Number::New(env, 0);
  }
  // Check if the argument is an array
  if (!info[0].IsArray()) {
    Napi::TypeError::New(env, "Expected an array of numbers")
        .ThrowAsJavaScriptException();
    return Napi::Number::New(env, 0);
  }
  // Convert the input to a double array
  Napi::Array inputArray = info[0].As<Napi::Array>();
  int64_t block_list_size = inputArray.Length();
  std::vector<double> block_list(block_list_size);

  for (int64_t i = 0; i < block_list_size; i++) {
    Napi::Value val = inputArray[i];
    if (!val.IsNumber()) {
      Napi::TypeError::New(env, "Array elements must be numbers")
          .ThrowAsJavaScriptException();
      return Napi::Number::New(env, 0);
    }
    block_list[i] = val.As<Napi::Number>().DoubleValue();
  }

  // Get the pointer to the underlying array data
  double* block_list_ptr = block_list.data();

  double result = calc_loudness_album(block_list_ptr, block_list_size);
  return Napi::Number::New(env, result);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "calc_loudness"),
              Napi::Function::New(env, CalcLoudnessWrapper));

  exports.Set(Napi::String::New(env, "calc_loudness_album"),
              Napi::Function::New(env, CalcLoudnessAlbumWrapper));

  return exports;
}

NODE_API_MODULE(binding, Init)