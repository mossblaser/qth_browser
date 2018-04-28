/**
 * Internal. Does a directory contents listing contain an event?
 */
export const containsEvent = entries =>
  entries &&
  entries.some(({behaviour}) => behaviour.startsWith("EVENT-"));

/**
 * Internal. Does a directory contents listing contain a property?
 */
export const containsProperty = entries =>
  entries &&
  entries.some(({behaviour}) => behaviour.startsWith("PROPERTY-"));

/**
 * Internal. Does a directory contents listing contain a directory?
 */
export const containsDirectory = entries =>
  entries &&
  entries.some(({behaviour}) => behaviour == "DIRECTORY");

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
 * Check if a directory exists.
 *
 * Returns true if the directory exists (and all subdirectories exist too) and
 * false if the directory definately does not exist. If insufficient
 * information is available, returns undefined.
 */
export function directoryExists(path, directories) {
	let parentPath = null;
	for (const subPath of allSubdirectories(path)) {
		// If not the root, check the parent directory that this path is defined as
		// a subdirectory.
		if (parentPath !== null) {
			// Work out the name of this directory (rather than its full path). 
			let thisDirName = (
				subPath
					// First strip off the trailing slash (NB: Since we never do this
					// check on the root this is fine!)
					.substring(0, subPath.length-1)
					// Next get the part after the last slash
					.split("/").splice(-1, 1)[0]
			);
			
			if (!containsDirectory(directories[parentPath].contents[thisDirName])) {
				return false;
			}
		}
		parentPath = subPath;
		
		// If intermediate directory doesn't exist: Inconclusive.
		if (!directories.hasOwnProperty(subPath) ||
		    !directories[subPath].contents ||
		    !directories[subPath].valid
		    ) {
			return undefined;
		}
		
	}
	
	// All parent directories define this directory and this directory exists in
	// the tree. We're all good!
	return true;
}
