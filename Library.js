const STMR_CARD_NAME = 'STMR - Ai Notepad'
InputText = ''

/**
 * Initialize STMR state and settings
 */
function initializeSTMR() {
    if (!state.stmr) {
        state.stmr = {}
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

    state.stmr.Version = '1.4.1'

    if (state.stmr.cachedContext === undefined) {
        state.stmr.cachedContext = ''
    }
    if (state.stmr.isRetry === undefined) {
        state.stmr.isRetry = false
    }
}


function getDescription(tpp, enbld, cc, np, vs) {
    desc = `STMR Settings (Edit these values):
turnsPerPlanning = ${tpp}
enabled = ${enbld}

--- STMR Status ---
Current Counter: ${cc}
Next Planning: ${np}

--- Instructions ---
Edit the settings above to customize STMR behavior.
- turnsPerPlanning: Number of turns between planning phases
- enabled: Set to true or false to enable/disable STMR
Settings are read each turn, so changes take effect immediately.

--- Version & GitHub ---
Version: ${vs}
https://github.com/TheMrEvil/ShortTermMemoryRedux`

    return desc;
}
/**
 * Creates the notepad card if it doesn't exist
 */
function createIfNoNotepadCard() {
    initializeSTMR();
    if (!storyCards.find(sc => sc.title === STMR_CARD_NAME)) {
        addStoryCard(STMR_CARD_NAME, 'None.', STMR_CARD_NAME)

        // Set up the card properties
        const notepadCard = storyCards.find(sc => sc.title === STMR_CARD_NAME)
        if (notepadCard) {
            notepadCard.keys = STMR_CARD_NAME
            // Initialize with settings in description
            notepadCard.description = getDescription(1, true, 0, 1, state.stmr.Version)
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

        notepadCard.description = getDescription(state.stmr.turnsPerPlanning, state.stmr.enabled, state.stmr.turnCounter, nextPlanningText, state.stmr.Version)
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
                state.stmr.turnsPerPlanning = newValue

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
    if (!state.stmr.isRetry) {
        state.stmr.turnCounter += 1
    }
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
    return (state.stmr.turnCounter >= state.stmr.turnsPerPlanning && !state.stmr.isRetry)
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
function stmrContext(text) {
    // Initialize state and retrieve settings
    initializeSTMR()
    retrieveSettingsFromCard()

    state.stmr.isRetry = false
    if (state.stmr.cachedContext === text) {
        state.stmr.isRetry = true
    }
    state.stmr.cachedContext = text
    console.log(info.actionCount)
    // Ensure notepad card exists
    createIfNoNotepadCard()

    // Reset planning flag each time to ensure clean state.
    state.stmr.isPlanning = shouldTriggerPlanning()
    // Check if it's time for planning based on our counter
    if (state.stmr.isPlanning) {
        text = removeInputFromText(text)
        // Read the existing notes from the card
        const notepadCard = storyCards.find(sc => sc.title === STMR_CARD_NAME)
        const existingNotes = notepadCard ? notepadCard.entry : 'None.'
        prompt = '[System: Youre Planner C-9, your task is to perform an internal planning step. Do not generate any story. Based on the story up to or past this point, if youre seeing this You are not the story teller, you are the planner and note-taker, start your output with 1., update your private notes.\n\nPrevious AI Notes:\n${existingNotes}\n\nPossible things to add/update in your notepad:\n\n1. HIDDEN MOTIVATIONS: What are NPCs thinking but not saying?\n2. SECRET CONVERSATIONS: Are there any whispered conversations or private thoughts?\n3. BEHIND-THE-SCENES EVENTS: What is happening elsewhere that affects this scene?\n4. LIES AND DECEPTIONS: Is anyone lying or hiding information?\n5. FUTURE PLOT HOOKS: What seeds can be planted for future reveals?\n6. PERSISTENT INFORMATION: Consolidate previous notes, adding new info and removing whats irrelevant.]';

        text = prompt + text;
        
        text += prompt;


        return { text }
    }

    // Always append notepad content to AI context for normal turns
    text = feedNotepadToAI(text)

    // Always update the card description with current status
    storeSettingsToCard()

    return { text }
}

function stmrOutput(text) {
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

function stmrInput(text) {
    InputText = text
    return { text }
}
function removeInputFromText(text) {
    // Remove the input text from the context
    const inputRegex = new RegExp(InputText);
    text = text.replace(inputRegex, '');
    state.stmr.InputText = ''; // Clear the input after removing it
    return text
}