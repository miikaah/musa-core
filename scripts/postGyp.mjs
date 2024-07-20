import { exec } from "child_process";

if (process.platform === "darwin") {
  /**
   * The load commands can be viewed with `otool -l lib/bin/normalization-v1.0.0-darwin-arm64.node`
   */
  const changeLoadCommandPath = `
install_name_tool -change \
/opt/homebrew/opt/libsndfile/lib/libsndfile.1.dylib \
@loader_path/libsndfile.dylib \
addons/normalization/build/Release/normalization-v1.0.0-darwin-arm64.node

install_name_tool -change \
/opt/homebrew/opt/libebur128/lib/libebur128.1.dylib \
@loader_path/libebur128.dylib \
addons/normalization/build/Release/normalization-v1.0.0-darwin-arm64.node
`;

  exec(changeLoadCommandPath, (error, stdout, stderr) => {
    if (error) {
      console.error(`Postbuild error: ${error}`);
      return;
    }
    if (stdout) {
      console.log(`stdout: ${stdout}`);
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
  });
}
