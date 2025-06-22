import os
from dotenv import load_dotenv
from vapi import Vapi 
import voice_setup

load_dotenv() 

VAPI_API_KEY = os.getenv("VAPI_TOKEN")
VAPI_PHONE_ID = os.getenv("PHONE_ID")
PERMENANT_ID = os.getenv("PERMANENT_ID")
ASSISTANT_NAME = "Customer Support Assistant"

if VAPI_API_KEY is None:
    raise ValueError("VAPI_TOKEN environment variable not set. Check your .env file.")
elif VAPI_PHONE_ID is None:
    raise ValueError("PHONE_ID environment variable not set. Check your .env file.")
else:   
    vapi_client = Vapi(token=VAPI_API_KEY)

voice_agents = {"Dad": "chris", "Mom": "jennifer", "Friend": "friend"}
persona = voice_agents["Dad"]

convo_context = voice_setup.change_convo_context(persona)  #changes conversation context based on voice_agent.


safe_phrase = "Do you want to get pizza?"
phone_number = "+12095020198"



if __name__ == "__main__":
    #existing_object = voice_setup.get_existing_agent_object(vapi_client, PERMENANT_ID)

    existing_id = voice_setup.get_existing_agent_id(vapi_client, PERMENANT_ID)
    voice_assistant = voice_setup.update_agent(convo_context, persona, vapi_client, existing_id, safe_phrase, phone_number)

    #voice_assistant = voice_setup.update_call_transfer_number(vapi_client, existing_id, phone_number)