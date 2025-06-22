import os
from dotenv import load_dotenv
from vapi import Vapi 
import voice_setup
import make_call
from conversation_contexts import PERSONAS

load_dotenv() 

VAPI_API_KEY = os.getenv("VAPI_TOKEN")
VAPI_PHONE_ID = os.getenv("PHONE_ID")
PERMENANT_ID = os.getenv("PERMANENT_ID")

UMANG_API_KEY = os.getenv("UMANG_VAPI_TOKEN")
UMANG_PHONE_ID = os.getenv("UMANG_PHONE_ID")
UMANG_PERMENANT_ID = os.getenv("UMANG_PERMENANT_ID")


all_voices = {"mom": "jennifer",
              "dad": "chris",
              "female_friend": "melissa",
              "male_friend": "elliot",
              } 


voice = "mom"   #pick voice here. Must be a dictionary key that exists above in 'all_voices'

#voice_agent = all_voices[voice]     
voice_agent = all_voices.get(voice)

conversation_context = voice_setup.change_convo_context(voice)
#print(conversation_context)

#persona = voice_agents["Dad"]
#convo_context = voice_setup.change_convo_context(persona)  #changes conversation context based on voice_agent.

safe_phrase = "Do you want to get pizza?"
phone_number = "+12095020198"
umang_phone_number = "+12799778354"

    
if __name__ == "__main__":
    
    # Create a vapi client object using vapi token.
    vapi_client = Vapi(token=UMANG_API_KEY) 

    # Retrieve the entire vapi object in json format.
    vapi_assistant_object = voice_setup.get_existing_agent_object(vapi_client, UMANG_PERMENANT_ID)

    # Find an existing vapi assistant from the vapi token in .env file.
    vapi_assistant_id = voice_setup.get_existing_agent_id(vapi_client, UMANG_PERMENANT_ID)


    # Update the vapi assistants conversation context, persona (voice), safe phrase, and emergency contact phone number.
    voice_assistant = voice_setup.update_agent(conversation_context, voice_agent, vapi_client, vapi_assistant_id, safe_phrase, phone_number)

    #THE LINE BELOW IS WORKING CODE TO MAKE OUTGOING CALLS, WE HAVE 9 LEFT, USE SPARINGLY
    #make_call.make_outbound_call(vapi_client, vapi_assistant_id, umang_phone_number, UMANG_PHONE_ID)