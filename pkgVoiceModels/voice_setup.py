import conversation_contexts

def get_existing_agent_id(vapi_client, PERMANENT_ID):
    assistant_id_to_use = None
    # Check if a permanent assistant ID is defined
    if PERMANENT_ID:
            # Attempt to retrieve the existing assistant
            existing_assistant = vapi_client.assistants.get(PERMANENT_ID)
            print(f"Found existing assistant with ID: {existing_assistant.id}. Using existing ID")
            assistant_id_to_use = existing_assistant.id
            return assistant_id_to_use

def get_existing_agent_object(vapi_client, PERMANENT_ID):
    try:
        return vapi_client.assistants.get(PERMANENT_ID)
    except Exception:
        print(f"Error returning assistant object")

def change_convo_context(selected_persona):
    convo_context_to_use = conversation_contexts.PERSONAS.get(
    selected_persona.lower(), # Use .lower() for case-insensitive lookup
    )
    return convo_context_to_use

def update_agent(convo_context, voice_agent, vapi_client, existing_id, safe_phrase, phone_number):
    updated_assistant_config = {
        "model": { 
            "provider": "openai",
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "system",
                    "content": f"""{convo_context} if you hear {safe_phrase} use the 'transferCall' tool.""" 
                }
            ], 
            "tools": [ 
                {
                    "type": "transferCall", 
                    "destinations": [
                        {"type": "number", "number": phone_number}
                    ]
                },
            ]
        },

        "metadata": {"context":convo_context, "safe_word":safe_phrase},
        
        "voice": { 
            "provider": "playht",
            "voice_id": voice_agent,
        },
    
        "first_message": "Hey are you on your way home, where are you?", 

    }
    
    voice_assistant = vapi_client.assistants.update(
        existing_id,
        **updated_assistant_config # Unpack the dictionary of changes
    )

    print(f"Assistant {voice_assistant.id} updated successfully.") # <--- MOVED TO EXECUTE
    return voice_assistant # <--- Return after printing