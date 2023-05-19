const encode = (s: string): string => {
  return Buffer.from(s)
    .toString("base64")
    .replace(/\+/g, "-") // Convert '+' to '-'
    .replace(/\//g, "_") // Convert '/' to '_'
    .replace(/=+$/, ""); // Remove ending '='
};

const decode = (s: string): string => {
  // Append removed '=' chars
  s += Array(5 - (s.length % 4)).join("=");

  s = s
    .replace(/-/g, "+") // Convert '-' to '+'
    .replace(/_/g, "/"); // Convert '_' to '/'

  return Buffer.from(s, "base64").toString("utf8");
};

export default {
  encode,
  decode,
};
