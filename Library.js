const STMR_CARD_NAME = 'STMR - Ai Notepad'

/**
 * Initialize STMR state and settings
 */
function initializeSTMR() {
  if (!state.stmr) {
    state.stmr = {
      isPlanning,
      turnCounter,
      turnsPerPlanning,
       enabled,
        Version = '1.1.6',
    }
  }
  
    // Ensure all properties exist for backwards compatibility
    if (state.stmr.isPlanning === undefined) {
        state.stmr.isPlanning = false
    }
  if (state.stmr.turnCounter === undefined) {
      state.stmr.turnCounter = 0
  }
  
  if (state.stmr.turnsPerPlanning === undefined) {
      state.stmr.turnsPerPlanning = 1
  }

  if (state.stmr.enabled === undefined) {
      state.stmr.enabled = true
  }

    if (state.stmr.Version === undefined) {
        state.stmr.Version = '1.1.6'
    }
}

/**
 * Creates the notepad card if it doesn't exist
 */
function createIfNoNotepadCard() {
  if (!storyCards.find(sc => sc.title === STMR_CARD_NAME)) {
    addStoryCard(STMR_CARD_NAME, 'None.', STMR_CARD_NAME)
    
    // Set up the card properties
    const notepadCard = storyCards.find(sc => sc.title === STMR_CARD_NAME)
    if (notepadCard) {
      notepadCard.keys = STMR_CARD_NAME
      // Initialize with settings in description
      notepadCard.description = `STMR Settings (Edit these values):
turnsPerPlanning = 1
enabled = true

--- STMR Status ---
Current Counter: 0
Next Planning: In 1 turns

--- Instructions ---
Edit the settings above to customize STMR behavior.
- turnsPerPlanning: Number of turns between planning phases
- enabled: Set to true or false to enable/disable STMR
Settings are read each turn, so changes take effect immediately.

--- GitHub ---
Version: ${state.stmr.Version}
https://github.com/TheMrEvil/ShortTermMemoryRedux`
    }
  }
}

/**
 * Stores current settings and status to the notepad card description
 */
function storeSettingsToCard() {
  const notepadCard = storyCards.find(sc => sc.title === STMR_CARD_NAME)
  if (notepadCard) {
    initializeSTMR()
    const turnsUntilPlanning = state.stmr.turnsPerPlanning - state.stmr.turnCounter
    const nextPlanningText = state.stmr.enabled ? `In ${turnsUntilPlanning} turns` : 'DISABLED'
    
    notepadCard.description = `STMR Settings (Edit these values):
turnsPerPlanning = ${state.stmr.turnsPerPlanning}
enabled = ${state.stmr.enabled}

--- STMR Status ---
Current Counter: ${state.stmr.turnCounter}
Next Planning: ${nextPlanningText}

--- Instructions ---
Edit the settings above to customize STMR behavior.
- turnsPerPlanning: Number of turns between planning phases
- enabled: Set to true or false to enable/disable STMR
Settings are read each turn, so changes take effect immediately.

--- GitHub ---
Version: ${state.stmr.Version}
https://github.com/TheMrEvil/ShortTermMemoryRedux`
  }
}

/**
 * Retrieves settings from the notepad card description
 */
function retrieveSettingsFromCard() {
  const notepadCard = storyCards.find(sc => sc.title === STMR_CARD_NAME)
  if (notepadCard && notepadCard.description) {
    // Extract turnsPerPlanning
    const turnsMatch = notepadCard.description.match(/turnsPerPlanning\s*=\s*(\d+)/);
    if (turnsMatch) {
      const newValue = Number(turnsMatch[1])
      if (newValue >= 1 && newValue <= 10) {
        state.stmr.turnsPerPlanning = newValue
        console.log(`STMR: Updated turnsPerPlanning to ${newValue}`)
      }
    }

    // Extract enabled setting
    const enabledMatch = notepadCard.description.match(/enabled\s*=\s*(true|false)/i);
    if (enabledMatch) {
      state.stmr.enabled = enabledMatch[1].toLowerCase() === 'true'
    }
  }
}

/**
 * Increment the turn counter
 */
function incrementTurnCounter() {
  initializeSTMR()
  state.stmr.turnCounter += 1
}

/**
 * Reset the turn counter to zero
 */
function resetTurnCounter() {
  initializeSTMR()
  state.stmr.turnCounter = 0
}

/**
 * Check if it's time for a planning phase
 */
function shouldTriggerPlanning() {
  initializeSTMR()
  retrieveSettingsFromCard()
  
  // Don't trigger if STMR is disabled
  if (!state.stmr.enabled) {
    return false
  }
  
  // Trigger planning when counter reaches the threshold
  return state.stmr.turnCounter >= state.stmr.turnsPerPlanning
}

/**
 * Updates the notepad card with new content
 */
function updateNotepadCard(content) {
  const notepadCard = storyCards.find(sc => sc.title === STMR_CARD_NAME)
  if (notepadCard) {
    notepadCard.entry = content
  } else {
  }
}

/**
 * Appends the notepad content to the context every turn
 */
function feedNotepadToAI(text) {
  initializeSTMR()
  retrieveSettingsFromCard()
  
  // Only append notes if STMR is enabled and we're not currently planning
  if (state.stmr.enabled && !state.stmr.isPlanning) {
    const notepadCard = storyCards.find(sc => sc.title === STMR_CARD_NAME)
    
    if (notepadCard && notepadCard.entry && notepadCard.entry !== 'None.') {
      // Append the notepad content to the end of the context
      text = text + "\n\n[STMR Notes(ONLY TO BE EDITED BY PLANNER C-9): " + notepadCard.entry + "]"
    }
  }
  
  return text
}

/**
 * Modifies the context to inject a planning prompt on certain turns.
 * @param {string} text The context text.
 * @returns {{text: string}} The modified context.
 */
function stmrContext(text) {
    initializeSTMR()
  // Ensure notepad card exists
  createIfNoNotepadCard()
  
  // Initialize state and retrieve settings
  initializeSTMR()
  retrieveSettingsFromCard()

  // Reset planning flag each time to ensure clean state.
  state.stmr.isPlanning = false

  // Check if it's time for planning based on our counter
  if (shouldTriggerPlanning()) {
    state.stmr.isPlanning = true

    // Read the existing notes from the card
    const notepadCard = storyCards.find(sc => sc.title === STMR_CARD_NAME)
    const existingNotes = notepadCard ? notepadCard.entry : 'None.'
    prompt = text
    prompt += `[System: You're Planner C-9, your task is to perform an internal planning step. Do not generate any story text. Based on the story up to or past this point, if you're seeing this You are not the story teller, you are the planner and note-taker', update your private notes.

Previous AI Notes:
${existingNotes}

Possible things to add/update in your notepad:

1. HIDDEN MOTIVATIONS: What are NPCs thinking but not saying?
2. SECRET CONVERSATIONS: Are there any whispered conversations or private thoughts?
3. BEHIND-THE-SCENES EVENTS: What is happening elsewhere that affects this scene?
4. LIES AND DECEPTIONS: Is anyone lying or hiding information?
5. FUTURE PLOT HOOKS: What seeds can be planted for future reveals?
6. PERSISTENT INFORMATION: Consolidate previous notes, adding new info and removing what's irrelevant.]`
    

    return { text }
  }

  // Always append notepad content to AI context for normal turns
  text = feedNotepadToAI(text)

  // Always update the card description with current status
  storeSettingsToCard()

  return { text }
}

/**
 * Handles the output from the AI. This function updates the notepad card and manages the counter.
 * @param {string} text The AI's output text.
 * @returns {{stop: boolean, text: string}} The modification result.
 */
function stmrOutput (text) {
  if (state.stmr && state.stmr.isPlanning) {
    state.stmr.isPlanning = false

    let newNotepadContent = text // Default content if parsing fails


      // Ensure card exists and update it
      initializeSTMR()
    createIfNoNotepadCard()
    updateNotepadCard(newNotepadContent)
    
    // Reset the counter after planning is complete
    resetTurnCounter()
    
    // Update card with new settings/status
    storeSettingsToCard()
    
      // Inform the user that planning is complete
      text = "\n\n[STMR updated - feel free to delete and continue]";
      return { text };
  }

  // Increment the turn counter for normal story turns (only if enabled)
  if (state.stmr && state.stmr.enabled && !state.stmr.isPlanning) {
    incrementTurnCounter()
  }

  // Update card description with current status
  storeSettingsToCard()

  return { text }
}