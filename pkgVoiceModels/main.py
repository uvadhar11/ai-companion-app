import os
from dotenv import load_dotenv
from vapi import Vapi 
import voice_setup

load_dotenv() 

VAPI_API_KEY = os.getenv("VAPI_TOKEN")
VAPI_PHONE_ID = os.getenv("PHONE_ID")
PERMENANT_ID = os.getenv("PERMANENT_ID")



voice_agents = {"Dad": "chris", "Mom": "jennifer", "Friend": "friend"}
persona = voice_agents["Dad"]

convo_context = voice_setup.change_convo_context(persona)  #changes conversation context based on voice_agent.

safe_phrase = "Do you want to get pizza?"
phone_number = "+12095020198"


if __name__ == "__main__":
    vapi_client = Vapi(token=VAPI_API_KEY)  #creates a vapi client object using vapi token.

    #retrieves the entire vapi object in json format.
    vapi_assistant_object = voice_setup.get_existing_agent_object(vapi_client, PERMENANT_ID)

    #finds an existing vapi assistant from the vapi token in .env file.
    vapi_assistant_id = voice_setup.get_existing_agent_id(vapi_client, PERMENANT_ID)

    #updates the vapi assistants conversation context, persona (voice), safe phrase, and emergency contact phone number.
    voice_assistant = voice_setup.update_agent(convo_context, persona, vapi_client, existing_id, safe_phrase, phone_number)
