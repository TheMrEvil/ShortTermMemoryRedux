// Checkout the Guidebook examples to get an idea of other ways you can use scripting
// https://help.aidungeon.com/scripting

// Every script needs a modifier function
const modifier = (text) => {
  // All logic is in Library.js
  return stmrContext(text)
}

// Don't modify this part
modifier(text)