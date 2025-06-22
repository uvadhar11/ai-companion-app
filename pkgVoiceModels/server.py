from flask import Flask, request
from conversation_contexts import PERSONAS

app = Flask(__name__)

ADDITIONAL_CONTEXT = {}

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

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

