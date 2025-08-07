// Checkout the Guidebook examples to get an idea of other ways you can use scripting
// https://help.aidungeon.com/scripting

// Every script needs a modifier function
const modifier = (text) => {
  // This script will no longer modify the input.
	return stmrInput(text)
}

// Don't modify this part
modifier(text)