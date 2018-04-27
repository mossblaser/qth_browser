/**
 * Generate all of the subdirectories and containing directory of a given path.
 *
 * E.g. given a Qth path, e.g. "foo/bar/baz", generates "", "foo/" and
 * "foo/bar/" or given "foo/bar/" generates the same.
 */
export function* allSubdirectories(path) {
  yield "";
  
  const parts = path.split("/");
  let curPath = "";
  for (let i = 0; i < parts.length - 1; i++) {
    curPath += parts[i] + "/";
    yield curPath;
  }
}

/**
 * Split the Qth path into parts.
 *
 * E.g. given a Qth path, e.g. "foo/bar/baz", generates "", "foo",
 * "bar" and "baz". Given "foo/bar/" generates "", "foo", "bar" and "".
 */
export function* allPathParts(path) {
  yield "";
  
  if (path.length > 0) {
		for (const part of path.split("/")) {
  	  yield part;
  	}
  }
}

