from flask import Flask, request
from conversation_contexts import PERSONAS
from make_call import make_outbound_call
from vapi import Vapi
import voice_setup
import os

app = Flask(__name__)

ADDITIONAL_CONTEXT = {}

PERMENANT_ID = os.getenv("PERMANENT_ID")
VAPI_API_KEY = os.getenv("VAPI_TOKEN")
UMANG_PHONE_ID = os.getenv("UMANG_PHONE_ID")
UMANG_API_KEY = os.getenv("UMANG_VAPI_TOKEN")


@app.route('/update_context', methods=['POST'])
def update_context():
    print("Endpoint /update_context was hit")
    data = request.json
    context = data.get('context')
    voice = data.get('voice', 'female_friend')

    if context:
        print("Received context:", context)
        if voice in PERSONAS:
            ADDITIONAL_CONTEXT[voice] = context
            full_context = f"{PERSONAS[voice]}\n* Additional user context:\n- {context}"
            PERSONAS[voice] = full_context
            print("Updated persona context:\n", full_context)
        else:
            print("Voice not found in PERSONAS:", voice)

        return {'message': 'Context received'}, 200
    else:
        return {'error': 'No context provided'}, 400


@app.route('/outbound_call', methods=['POST'])
def outbound_call():
    print("Endpoint /outbound_call was hit")
    data = request.json
    number = data.get('number')

    if not number:
        return {'error': 'No phone number provided'}, 400
    print("Received phone number:", number)
    try:
        vapi_assistant_id = voice_setup.get_existing_agent_id(
            vapi_client, PERMENANT_ID)

        call = make_outbound_call(
            vapi_client, vapi_assistant_id, number, UMANG_PHONE_ID)
        return {'message': 'Call initiated', 'call_id': call.id}, 200
    except Exception as e:
        print("Error making outbound call:", e)
        return {'error': str(e)}, 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
    vapi_client = Vapi(token=UMANG_API_KEY)
