
def make_outbound_call(client, assistant_id: str, phone_number: str, PHONE_ID: str):
    try:
        call = client.calls.create(
            assistant_id=assistant_id,
            phone_number_id=PHONE_ID,  # Your Vapi phone number ID
            customer={
                "number": phone_number,  # Target phone number
            },
        )
        
        print(f"Outbound call initiated: {call.id}")
        return call
    except Exception as error:
        print(f"Error making outbound call: {error}")
        raise error