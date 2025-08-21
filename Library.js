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
    if (state.stmr.existingNotes === undefined) {
        state.stmr.existingNotes = ''
    }
    if (state.stmr.notePrompt === undefined) {
        state.stmr.notePrompt = '[System: Youre Planner C-9, your task is to perform an internal planning step. Do not generate any story. Based on the story up to or past this point, if youre seeing this You are not the story teller, you are the planner and note-taker, prior notes will not be kept unless rewritten.\nPossible things to add/update in your notepad:\nhidden motivations, secret conversations, behind-the-scenes events, lies and deceptions, future plot hooks]';
    }

    state.stmr.Version = '1.6.0'

    if (state.stmr.cachedContext === undefined) {
        state.stmr.cachedContext = ''
    }
    if (state.stmr.isRetry === undefined) {
        state.stmr.isRetry = false
    }
    if (state.stmr.cachedHash === undefined) {
        state.stmr.cachedHash = ''
    }
    if (state.stmr.cachedTextLink === undefined) {
        state.stmr.cachedTextValidator = ''
    }
}


function getDescription(tpp, enbld, notePrompt, np, vs, cc) {
    desc = `STMR Settings (Edit these values):
turnsPerPlanning = ${tpp}
enabled = ${enbld}
notePrompt = ${notePrompt}

--- STMR Status ---
Turn Counter: ${cc}
Next Planning: ${np}

--- Instructions ---
Edit the settings above to customize STMR behavior.
- turnsPerPlanning: Number of turns between planning phases
- enabled: Set to true or false to enable/disable STMR
- notePrompt: The prompt used for planning phase
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
            notepadCard.description = getDescription(
                1,
                true,
                state.stmr.notePrompt,
                1,
                state.stmr.Version,
                state.stmr.turnCounter
            )
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

        notepadCard.description = getDescription(
            state.stmr.turnsPerPlanning,
            state.stmr.enabled,
            state.stmr.notePrompt,
            nextPlanningText,
            state.stmr.Version,
            state.stmr.turnCounter
        )
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

        // Extract notePrompt
        const notePromptMatch = notepadCard.description.match(/notePrompt\s*=\s*([\s\S]*?)\n--- STMR Status ---/);
        if (notePromptMatch) {
            state.stmr.notePrompt = notePromptMatch[1].trim();
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
            text = "[STMR Notes(ONLY TO BE EDITED BY PLANNER C-9): " + notepadCard.entry + "]" + text;
        }
    }

    return text
}
function stmrContext(text) {
    // Initialize state and retrieve settings
    initializeSTMR()
    retrieveSettingsFromCard()
    state.stmr.isRetry = getIsRetry(text);
    cacheContextVAL(text);

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
        state.stmr.existingNotes = notepadCard ? notepadCard.entry : 'None.'
        prompt = state.stmr.notePrompt + "\nExisting Notes: " + state.stmr.existingNotes
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
        text = "\n\n[STMR updated - erase and continue]";
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
function cacheContextVAL(text) {
    state.stmr.cachedHash = hash(text);
    state.stmr.cachedTextLink = getTextLink(text);
}
function hash(str) {  //credits to lewdleah for of hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((31 * hash) + str.charCodeAt(i)) % 65536;
    }
    return hash.toString(36);
}
function getTextLink(str) {
    return str[0] + str[1] + str[str.length - 2] + str[str.length - 1]
}
function getIsRetry(text) {
    if (state.stmr.cachedHash === undefined || state.stmr.cachedTextLink === undefined) return false;
    let Chash = hash(text);
    let Clink = getTextLink(text);
    return (Chash === state.stmr.cachedHash && Clink === state.stmr.cachedTextLink);
}